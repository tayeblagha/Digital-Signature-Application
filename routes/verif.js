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
      cb(null, "dateVerification/")
    },
    filename: (req, file, cb) => {
      cb(null,'dateVerification.pdf')
    },
  })

  

  
  const upload = multer({ storage: storage })




router.get('/verifySignaturewithDate',async  (req, res) => {
    try{
    const { token,  email,result,date } = req.query;
    const user = await User.findOne({ email: email ,_id:token});
    console.log(user.name);
  if (user){
    res.render('Signature/DateVerification',{token:token,email:email,result:result,date:date});}
    else{ console.log(error);res.render('error')}
  }
  catch(error){res.render('error'); }
  })
  router.post('/verifySignaturewithDate',upload.single('datePdf'), async(req, res) => {
    let {  userEmail,token,email,userToken } = req.body
    userToken = userToken.replace(/\s+/g, '');
    userEmail = userEmail.replace(/\s+/g, '');

    try { 
    const base64 = require('base64topdf');
    console.log(email);
    // this is done to avoid duplikate key error in same database
    userEmail=userEmail+'.com'
    let encodedPdf = base64.base64Encode(`dateVerification/dateVerification.pdf`);
      const signedPdf= await pdfModel.findOne({ email: userEmail,base64:encodedPdf,Token:userToken });
  let result ;
  if(signedPdf){ result=true;       res.redirect(`/verif/verifySignaturewithDate?token=${token}&email=${email}&result=${result}&date=${signedPdf.date}`)
}  
  else {   result=false;
    res.redirect(`/verif/verifySignaturewithDate?token=${token}&email=${email}&result=${result}&date=`)

  
  }
  
    } catch(err) {
    console.log(err)
    res.render('Signature/error500')  
      }
    }
  )
  
  module.exports = router