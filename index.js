const bip39 = require('bip39');
const web3 = require('@solana/web3.js');
const ed25519 = require("ed25519-hd-key");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");

const express = require('express');
const app = express();
const morgan = require('morgan');

const LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL

// Settings 
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());


// ----Routes----

//Generate Mnemonic
app.get('/mnemonic', (req, res) => {
    mnemonic = bip39.generateMnemonic()
    res.send(mnemonic)
})


//Generate Keypair (return publicKey)
app.get('/keypair_public_key/:mnemonic', (req, res) => {
    const { mnemonic } = req.params;
    const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    const path = `m/44'/501'/0'/0'`;
    const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key);
    res.send(keypair.publicKey.toString())
})

//Generate Keypair (return secretKey)
app.get('/keypair_secret_key/:mnemonic', (req, res) => {
    const { mnemonic } = req.params;
    const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    const path = `m/44'/501'/0'/0'`;
    const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key);
    res.send(keypair.secretKey.toString())
})


//Crear Conexion
function createConnection(cluster) {
    return new web3.Connection(web3.clusterApiUrl(cluster))
}

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
    
        var signature = web3.sendAndConfirmTransaction(
            connection,
            transferTransaction,
            [keypair]).catch((err) => {
            res.send(err)
        })
        res.send("success")
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

        var signature = web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send("success")
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

        var signature = web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]).catch((err) => {
            res.send(err)
        })
        res.send("success")
    } catch (error) {
        res.send(error.message)
    }

})


// Starting the Server
app.listen(app.get('port'), () =>{
    console.log(`Server on port ${app.get('port')}`);
})