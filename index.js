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

//Recibir Mnemonic
app.post('/enviar_mnemonic', (req, res) => {
    mnemonic = req.body['mnemonic']
    console.log(mnemonic);
    return mnemonic
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

async function sendTransaction(fromPubkey, toPublicKey, lamps){

    const connection = createConnection("devnet")

    const transferTransaction = new Transaction()
      .add(SystemProgram.transfer({
        fromPubkey: new PublicKey(fromPubkey),
        toPubkey: new PublicKey(toPublicKey),
        lamports: lamps / LAMPORTS_PER_SOL 
    }))

    await sendAndConfirmTransaction(connection, transferTransaction, [fromKeypair]);
}    

//Enviar SPL TOKEN


// Starting the Server
app.listen(app.get('port'), () =>{
    console.log(`Server on port ${app.get('port')}`);
})