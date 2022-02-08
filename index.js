const bip39 = require('bip39');
const web3 = require('@solana/web3.js');
const ed25519 = require("ed25519-hd-key");

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


//Crear Conexion
function createConnection(cluster) {
    return new web3.Connection(web3.clusterApiUrl(cluster))
}

// Enviar SOL

app.get('/send_transaction/:mnemonic/:toPublicKey/:lamps', (req, res) => {

    const { mnemonic, toPublicKey, lamps } = req.params;

    const connection = createConnection("devnet")
    
    const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    const path = `m/44'/501'/0'/0'`;
    const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key)
    
    const transferTransaction = new Transaction()
      .add(SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new web3.PublicKey(toPublicKey),
        lamports: lamps / LAMPORTS_PER_SOL 
    }))
    
    var signature = await sendAndConfirmTransaction(connection, transferTransaction, [keypair])

    res.send(signature)
})


//Enviar SPL TOKEN


// Starting the Server
app.listen(app.get('port'), () =>{
    console.log(`Server on port ${app.get('port')}`);
})