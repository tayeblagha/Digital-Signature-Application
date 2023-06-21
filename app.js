var express = require('express');
var router = express.Router();
let crypto = require('crypto');
const dotenv =require('dotenv');
const morgan =require('morgan');
const bodyparser=require('body-parser')
const app=express();

dotenv.config( { path : 'config.env'} )
const PORT = process.env.PORT || 8080

// log requests
app.use(morgan('tiny'));



// parse request to body-parser
app.use(bodyparser.urlencoded({ extended : true}));

// set view engine
app.set("view engine", "ejs")

/* GET home page. */
router.get('/',  (req, res) => {
  res.render('index', { title: 'Express' });
});
//genratic symetric keypair 
// localhost:3000/generate-key-pair
router.get('/generate-key-pair', (req, res)=>{
const {publicKey,privateKey} = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'der', }, privateKeyEncoding: { type: 'pkcs8', format: 'der' },})
res.render
  //res.send({publicKey:publicKey.toString('base64'),privateKey:privateKey.toString('base64')})
})
// localhost:3000/sign
router.post('/sign',(req, res) => {
  const base64 = require('base64topdf');
  let encodedPdf = base64.base64Encode('test/sample.pdf');
let privateKey=req.body.privateKey
 privateKey=crypto.createPrivateKey({
  key: Buffer.from(privateKey,'base64'),type: 'pkcs8',format:'der',
 })
 const sign =crypto.createSign('SHA256')
 sign.update(encodedPdf)
 sign.end()
 const signature=sign.sign(privateKey).toString('base64')
res.send({encodedPdf,signature})
})



// localhost:3000/verify
router.post('/verify',(req,res)=>{
  const base64 = require('base64topdf');
let {encodedPdf,publicKey,signature}=req.body
publicKey=crypto.createPublicKey({
  key:Buffer.from(publicKey,'base64'),
  type:'spki',format:'der'
})
const verify=crypto.createVerify('SHA256')
verify.update(encodedPdf);
verify.end();
let result=verify.verify(publicKey,Buffer.from(signature,'base64'))
if (result==true){
  let decodedBase64 = base64.base64Decode(encodedPdf,'exported');

}
res.send({verify:result})

}


)

router.get('/convertPdftoBase64', (req, res)=>{
  const base64 = require('base64topdf');
  let encodedPdf = base64.base64Encode('test/sample.pdf');
  res.send(encodedPdf)
  })
  app.listen(PORT, ()=> { console.log(`Server is running on http://localhost:${PORT}`)});
module.exports = router;

