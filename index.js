const bip39 = require('bip39');
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const ed25519 = require("ed25519-hd-key");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");

const { Metaplex } = require("@metaplex-foundation/js");
const axios = require('axios');

const express = require('express');
const app = express();
const morgan = require('morgan');

const LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL
const endpoint = 'https://divine-dark-diagram.solana-mainnet.discover.quiknode.pro/7426100fea9dc7fa342dbc8123aaaad6f55b1960/'

// Settings 
app.set('port', process.env.PORT || 4000);
app.set('json spaces', 2);

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//variables
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")

//Crear Conexion
function createConnection(cluster) {
    return new web3.Connection(web3.clusterApiUrl(cluster),"confirmed");
}

app.get('/getNfts/:pubKey', async (req, res) => {
    const { pubKey } = req.params;
    
    const nfts = []

    const connection = new web3.Connection(endpoint);
    const wallet = new web3.PublicKey(pubKey)

    const metaplex = new Metaplex(connection);
    const myNfts = await metaplex.nfts().findAllByOwner({
        owner: wallet
    });

    for (let i = 0; i < myNfts.length; i++) {
        const uri = myNfts[i].uri;
        await axios.get(uri).then(response => {
            nfts.push(response.data)
        })
    }

    res.json(nfts)
})

// ----Routes----

//Generate Mnemonic
app.get('/mnemonic', (req, res) => {
    const mnemonic = bip39.generateMnemonic()
    res.send(mnemonic)
})

//---------------------RUTAS SIN MNEMONICO------------------------//

//Generate Keypair sin Mnemonic (return publicKey)
app.get('/keypair', (req, res) => {
    const keypair = web3.Keypair.generate();
    const secret_key = bs58.encode(keypair.secretKey)
    res.json({
        'public_key': keypair.publicKey.toString(),
        'secret_key': secret_key
    })
})

//enviar SOL con la secret key 
app.get('/send_transaction_sk/:secretKey/:toPublicKey/:amount', async (req, res) => {
    const { secretKey, toPublicKey, amount } = req.params;

    try {
        const toPubKey = new web3.PublicKey(toPublicKey)
        const connection = createConnection("mainnet-beta")

        //create Keypair
        const keypair = web3.Keypair.fromSecretKey(
            bs58.decode(secretKey)
        );   
          
        const transferTransaction = new web3.Transaction()
        .add(web3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: toPubKey,
            lamports: amount * LAMPORTS_PER_SOL 
        }))
    
        var signature = await web3.sendAndConfirmTransaction(
            connection, 
            transferTransaction, 
            [keypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
       res.send(error.message)
    }

})

//Enviar SPL con la secret key 
app.get('/send_transaction_spl_sk/:secretKey/:toPublicKey/:amount/:mint', async (req, res) => {

    const { secretKey, toPublicKey, amount, mint } = req.params;
    const connection = createConnection("mainnet-beta")
    const myMint = new web3.PublicKey(mint)
    
    try {

        //create Keypair
        const fromKeypair = web3.Keypair.fromSecretKey(
            bs58.decode(secretKey)
        );

        var myToken = new Token(
            connection,
            myMint,
            TOKEN_PROGRAM_ID,
            fromKeypair
        )

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            fromKeypair.publicKey
        )
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            new web3.PublicKey(toPublicKey)
        )

        const transaction = new web3.Transaction()
            .add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    fromKeypair.publicKey,
                    [],
                    amount * LAMPORTS_PER_SOL
                )
        )

        var signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
        res.send(error.message)
    }

})

//Enviar SPL Estable
app.get('/send_transaction_spl_stable_sk/:secretKey/:toPublicKey/:amount/:mint', async (req, res) => {

    const { secretKey, toPublicKey, amount, mint } = req.params;
    const connection = createConnection("mainnet-beta")
    const myMint = new web3.PublicKey(mint)
    try {

        //Create keypair
        const fromKeypair = web3.Keypair.fromSecretKey(
            bs58.decode(secretKey)
        );

        var myToken = new Token(
            connection,
            myMint,
            TOKEN_PROGRAM_ID,
            fromKeypair
        )

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            fromKeypair.publicKey
        )
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            new web3.PublicKey(toPublicKey)
        )

        const transaction = new web3.Transaction()
            .add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    fromKeypair.publicKey,
                    [],
                    amount * 1000000
                )
        )

        var signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
        res.send(error.message)
    }

})

//-------------------FIN RUTAS SIN MNEMONICO----------------------------//


//-------------------RUTAS CON MNEMONICO--------------------------------//

//Generate Keypair (return publicKey and secretKey)
app.get('/keypair/:mnemonic', (req, res) => {
    const { mnemonic } = req.params;
    const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    const path = `m/44'/501'/0'/0'`;
    const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key);
    const secret_key = bs58.encode(keypair.secretKey)
    res.json({
        'public_key': keypair.publicKey.toString(),
        'secret_key': secret_key
    })
})

//Get Balance Sol
app.get('/getBalanceSol/:publicKey', async (req, res) => {
    const { publicKey } = req.params;
    const connection = createConnection("mainnet-beta")

    const lamports = await connection.getBalance(new web3.PublicKey(publicKey)).catch((err) => {
        console.log(err);
    })

    const sol = lamports / LAMPORTS_PER_SOL
    res.json({
        'balance': sol
    })
})

//Get Balance SPL
app.get('/getBalanceSpl/:publicKey', async (req, res) => {
    const { publicKey } = req.params;
    const connection = createConnection("mainnet-beta")

    const lamports = await connection.getBalance(new web3.PublicKey(publicKey)).catch((err) => {
        console.log(err);
    })

    const sol = lamports / LAMPORTS_PER_SOL
    res.json({
        'balance': sol
    })
})

//buscar cuentas asociadas a tokens
async function findAssociatedTokenAddress(walletAddress,tokenMintAddress) {
    return (
      await web3.PublicKey.findProgramAddress(
        [
          walletAddress.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintAddress.toBuffer(),
        ],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      )
    )[0];
}

//get Balance SPL
app.get('/getBalanceSPL/:publicKey/:splToken', async (req, res) => {
    const { publicKey, splToken } = req.params;
    const connection = createConnection("mainnet-beta")
    const account = await findAssociatedTokenAddress(new web3.PublicKey(publicKey), new web3.PublicKey(splToken))
    try {
        const balance = await connection.getTokenAccountBalance(new web3.PublicKey(account.toString()))
        res.json({
            'balance': balance.value.uiAmount
        })
      } catch (e) {
        res.json({
            'error': e
        })
      }
})

// Enviar SOL
app.get('/send_transaction/:mnemonic/:toPublicKey/:amount', async (req, res) => {

    const { mnemonic, toPublicKey, amount } = req.params;
    try {
        const toPubKey = new web3.PublicKey(toPublicKey)
        const connection = createConnection("mainnet-beta")
    
        const seed = bip39.mnemonicToSeedSync(mnemonic, "")
        const path = `m/44'/501'/0'/0'`;
        const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key)
    
        const transferTransaction = new web3.Transaction()
        .add(web3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: toPubKey,
            lamports: amount * LAMPORTS_PER_SOL 
        }))
    
        var signature = await web3.sendAndConfirmTransaction(
            connection, 
            transferTransaction, 
            [keypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
       res.send(error.message)
    }
})

//Enviar SPL
app.get('/send_transaction_spl/:mnemonic/:toPublicKey/:amount/:mint', async (req, res) => {

    const { mnemonic, toPublicKey, amount, mint } = req.params;
    const connection = createConnection("mainnet-beta")
    const myMint = new web3.PublicKey(mint)
    try {

        //Creacion de la Cuenta (Keypair)
        const seed = bip39.mnemonicToSeedSync(mnemonic, "")
        const path = `m/44'/501'/0'/0'`;
        const fromKeypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key)

        var myToken = new Token(
            connection,
            myMint,
            TOKEN_PROGRAM_ID,
            fromKeypair
        )

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            fromKeypair.publicKey
        )
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            new web3.PublicKey(toPublicKey)
        )

        const transaction = new web3.Transaction()
            .add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    fromKeypair.publicKey,
                    [],
                    amount * LAMPORTS_PER_SOL
                )
        )

        var signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
        res.send(error.message)
    }

})

//Enviar SPL Estable
app.get('/send_transaction_spl_stable/:mnemonic/:toPublicKey/:amount/:mint', async (req, res) => {

    const { mnemonic, toPublicKey, amount, mint } = req.params;
    const connection = createConnection("mainnet-beta")
    const myMint = new web3.PublicKey(mint)
    try {

        //Creacion de la Cuenta (Keypair)
        const seed = bip39.mnemonicToSeedSync(mnemonic, "")
        const path = `m/44'/501'/0'/0'`;
        const fromKeypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key)

        var myToken = new Token(
            connection,
            myMint,
            TOKEN_PROGRAM_ID,
            fromKeypair
        )

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            fromKeypair.publicKey
        )
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
            new web3.PublicKey(toPublicKey)
        )

        const transaction = new web3.Transaction()
            .add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount.address,
                    toTokenAccount.address,
                    fromKeypair.publicKey,
                    [],
                    amount * 1000000
                )
        )

        var signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send(signature)
    } catch (error) {
        res.send(error.message)
    }

})


// Starting the Server
app.listen(app.get('port'), () =>{
    console.log(`Server on port ${app.get('port')}`);
})