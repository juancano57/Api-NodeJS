const bip39 = require('bip39');
const web3 = require('@solana/web3.js');
const ed25519 = require("ed25519-hd-key");

const express = require('express');
const app = express();
const morgan = require('morgan');

let mnemonic = "";

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
    mnemonic = bip39.generateMnemonic();
    res.send(mnemonic);
});

//Recibir Mnemonic
app.post('/enviar_mnemonic', (req, res) => {
    mnemonic = req.body['mnemonic']
    console.log(mnemonic);
    return mnemonic
})

//Generate Keypair 
app.get('/keypair', (req, res) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic, "")
    const path = `m/44'/501'/0'/0'`;
    const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key);
    //res.send(keypair.publicKey.toString())
    res.send(keypair)
    // res.json({
    //     "public_key": keypair.publicKey.toString(),
    //     "secret_key": keypair.secretKey.toString()
    // })
});

// //Generate Keypair (return secretKey)
// app.get('/keypair_secret_key', (req, res) => {
//     const seed = bip39.mnemonicToSeedSync(mnemonic, "")
//     const path = `m/44'/501'/0'/0'`;
//     const keypair = web3.Keypair.fromSeed(ed25519.derivePath(path, seed.toString("hex")).key);
//     res.send(keypair.secretKey.toString())
// });

// Starting the Server
app.listen(app.get('port'), () =>{
    console.log(`Server on port ${app.get('port')}`);
})