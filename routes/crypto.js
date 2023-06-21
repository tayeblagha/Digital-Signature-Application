const express = require('express')
const router = express.Router();
let crypto = require('crypto');
const fs = require('fs');
const pdfcontent = require('pdf-parse')
var path = require('path');
const Jimp = require('jimp');
const { writeFileSync, readFileSync } = require("fs");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const User = require('../models/userModel');
var imgModel = require('../models/cryptoModel');
var pdfModel = require('../models/pdfModel');
const nodemailer = require('nodemailer');



const multer = require("multer")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
      cb(null,req.body.email+'.pdf')
    },
  })

  const verifyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "VerificationFolder/")
    },
    filename: (req, file, cb) => {
      cb(null,file.fieldname+`${req.body.email}.txt`)
    },
  })

  

  const uploadStorage = multer({ storage: storage })
  const verStorage = multer({ storage: verifyStorage })



// setting up email Verfication & mail sender details and function
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'gctdigisign@gmail.com',
      pass: 'svzqvggirhukhmll'
  },
  tls: {
      rejectUnauthorized: false
  }
})
function mailSending(user,pdf) {
  var mailOptions = {
      from: ' "verif your Signature <gctdigisign@gmail.com>"',
      to: user.email,
      subject: ' validate your signature',
      html: `<h2> Dear ${user.name} </h2>
      <h4> please click the link to sign pdf  </h4> 
      <a href="${process.env.host}/digitalSignature/verify-sign?token=${user.emailToken}&email=${user.email}">  Verify you email </a>
       `
  }
  // Sending email
  transporter.sendMail(mailOptions, function (error, info) {
      if (error) { console.log(error); res.render('Signature/error500') }
      else { console.log('verification email is sent to your gmail account') }
  })

}


router.post('/emailVerif',uploadStorage.single("uploadFile"), async (req, res) => {
  let { pdf, email } = req.body;  
  const user = await User.findOne({ email: email });
  mailSending(user, pdf);
res.render('authentification/emailVerification.ejs',{pdf:pdf,email:email});
})
// Email Signature verification
router.get('/verify-sign', async (req, res) => {

  try {

      const { token,  email } = req.query;
      const newEmailToken = crypto.randomBytes(64).toString('hex') + email;
      const pdf =email+'.pdf';
      var signedpdf = pdf.slice(0, -4);
      let dataBuffer=fs.readFileSync(`uploads/${pdf}`)
      const user = await User.findOne({ emailToken: token })
      const  pdftoken= 'Z2N0Cg=='+crypto.randomBytes(12).toString('hex') ;

      if (user) {
          user.emailToken = newEmailToken;
          await user.save();
          pdfcontent(dataBuffer).then(function(data){
            //  console.log(data.text);
              let x= data.text;
              var count=countOccurences(x,"Z2N0Cg=="); // 2

              if(count==0){addDatetoPDF5(`uploads/${signedpdf}`,email,pdftoken)}
              else if(count==1){addDatetoPDF4(`uploads/${signedpdf}`,email,pdftoken)}
              else if(count==2){addDatetoPDF3(`uploads/${signedpdf}`,email,pdftoken)}
              else if(count==3){addDatetoPDF2(`uploads/${signedpdf}`,email,pdftoken)}
              else if(count==4){addDatetoPDF1(`uploads/${signedpdf}`,email,pdftoken)}
              else {res.render('error')}

      //console.log('the word is repeated '+count+' times')
          })
          const string= pdf;
          res.redirect('/digitalSignature/continueSignature?valid=' + string+`&token=${pdftoken}`);

        }
      else {
        res.redirect('/auth/dashboard?valid='+email)
        console.log('thins link is no longer valid')
      }
  }
  catch (error) {
    res.render('Signature/error500')
      console.log(error);
  }
})
// Signing Pdf
router.post('/signed-pdf', async (req, res) => {
  let { pdf, email } = req.body;  
  var signedpdf = pdf.slice(0, -4);
  addDateAndSignaturetoPDF(`upload/${signedpdf}`,email);
  console.log(email);
const string=email;
res.redirect('/digitalSignature/continueSignature?valid=' + string);

})
router.get('/continueSignature', async function(req, res) {
  let pdf = req.query.valid;
  let token = req.query.token;
 // alert(token);
console.log(  'the token is '+token)
  console.log('email is ');

let email =pdf.slice(0, -4);
console.log(email);
const user = await imgModel.findOne({ email: email });
const finduser = await User.findOne({ email: email });

let privateKey= user.privateKey;
  const base64 = require('base64topdf');
  let encodedPdf = base64.base64Encode(`uploads/${pdf}`);


  console.log(email);
  privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKey, 'base64'), type: 'pkcs8', format: 'der',
  })
  const sign = crypto.createSign('SHA256')
  sign.update(encodedPdf)
  sign.end()
  const signature = sign.sign(privateKey).toString('base64');
  addPdftoDatabase(email,encodedPdf,token,signature);

  res.render('Signature/signatureResult', { encodedPdf, signature ,token:finduser.emailToken,email:email})

});
router.get('/sign/:id',async (req, res) => {
  const token = req.query.token;
  const findUser = await User.findOne({ _id: token })
  if(findUser){
  const email = req.params.id;
  const user = await imgModel.findOne({ email: email });
  const privateKey=user.privateKey;
  res.render('Signature/uploadPdf',{email:email,game:privateKey});}
  else{res.render('error');}
}
)
// verifying Signature
router.get('/verifySignature',async  (req, res) => {
  try{
  const { token,  email,result } = req.query;
  const user = await User.findOne({ email: email ,_id:token});
  console.log(user.name);
if (user){
  res.render('Signature/verifySignature',{token:token,email:email,result:result});}
  else{ console.log(error);res.render('error')}
}
catch(error){res.render('error'); }
})
router.post('/verifySignature',verStorage.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'sig', maxCount: 1 },
  { name: 'key', maxCount: 1 },

]), (req, res) => {
  try { 
  const base64 = require('base64topdf');
  let {  publicKey ,signature,token,email } = req.body
  
  let encodedPdf = base64.base64Encode(`VerificationFolder/pdf${email}.txt`);
  
  publicKey = crypto.createPublicKey({
    key: Buffer.from(publicKey, 'base64'),
    type: 'spki', format: 'der'
  })
  const verify = crypto.createVerify('SHA256')
  verify.update(encodedPdf);
  verify.end();
  let result = verify.verify(publicKey, Buffer.from(signature, 'base64'))
  // transform base64 to pdf
  if (result == true) {
    //let decodedBase64 = base64.base64Decode(encodedPdf, `export/export.pdf`);
  }
  
  res.redirect(`/digitalSignature/verifySignature?token=${token}&email=${email}&result=${result}`)
  } catch(err) {
  console.log(err)
  res.render('Signature/error500')  
    }
  }
)

// draw Signature 
router.get('/drawSig', (req, res) => {
  res.render('Signature/drawSig');
})
/* function */
async function addDateAndSignaturetoPDF(filename,email) {
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = 'Signed: ' + new Date().toUTCString();
  const textSize = 12;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 10;
  var VeticalPlacement = 20;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  lastPage.drawRectangle({
    x: horizentalPlacement,
    y: VeticalPlacement - 10,
    width: 290,
    height: 25,
    borderColor: rgb(1, 0, 0),
    borderWidth: 2,
  })
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 450,
    y: 5,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}


function countOccurences(string, word) {
  return string.split(word).length - 1;
}
// Generating Key Pair
router.get('/generateKeyPair', async (req, res) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'der', }, privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  })

  
var text="We went down to the stall, then down to the river."; 
var count=countOccurences(text,"down"); // 2
console.log('the word is repeated '+count+' times')
  //addDatetoPDF5('uploads/document','tayeblagha@gmail.com');
 
 // addDatetoPDF2('uploads/document','tayeblagha@gmail.com');


  res.render('Signature/generateKeyPair', { publicKey: publicKey.toString('base64'), privateKey: privateKey.toString('base64') })
})



async function addDatetoPDF1(filename,email,token) {
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = token
  const textSize = 6;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 480;
  var VeticalPlacement = 3;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 518,
    y: 10,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}


async function addDatetoPDF2(filename,email,token) {
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = token
  const textSize = 6;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 360;
  var VeticalPlacement = 3;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 398,
    y: 10,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}



async function addDatetoPDF3(filename,email,token){
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = token;
  const textSize = 6;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 240;
  var VeticalPlacement = 3;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 269,
    y: 10,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}


async function addDatetoPDF4(filename,email,token) {
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = token;
  const textSize = 6;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 120;
  var VeticalPlacement = 3;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 149,
    y: 10,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}

async function addDatetoPDF5(filename,email,token) {
  const document = await PDFDocument.load(readFileSync(`./${filename}.pdf`));
  //getting the number of pages
  let X = document.getPageCount();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const lastPage = document.getPage(X - 1);
  lastPage.moveTo(1, 20);
  const text = token;
  const textSize = 6;
  const textWidth = 25;
  const textHeight = 10
  var horizentalPlacement = 0;
  var VeticalPlacement = 3;
  lastPage.drawText(text, {
    x: horizentalPlacement,
    y: VeticalPlacement,
    font: courierBoldFont,
    size: textSize,
    color: rgb(0, 0.53, 0.71),
  });
  
  const imgBuffer = fs.readFileSync(`./storedImages/${email}.png`);
    const img = await document.embedPng(imgBuffer);

  const { width, height } = img.scale(1);
  lastPage.drawImage(img, {
    x: 29,
    y: 10,
  });
  writeFileSync(`${filename}.pdf`, await document.save());
}

async function   addPdftoDatabase(email,content,token,signature) {

  const user =new pdfModel( {
      mail:email+'.com',
      Token: token ,
      base64:content,
      signature:signature
  })


  
  const newUser =  await user.save();
}









module.exports = router