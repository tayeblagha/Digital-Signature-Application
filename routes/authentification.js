const express = require('express')
const router = express.Router()
const fs = require('fs');
const mongoose = require('mongoose')
const User = require('../models/userModel');
var imgModel = require('../models/cryptoModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')
const { verifyEmail } = require('../config/JWT')
const { loginrequired} = require ('../config/JWT')
const { testing} = require ('../config/JWT')
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey');
var pdfModel = require('../models/pdfModel');







router.get('/changePass/:id',  (req, res) => {
    const email = req.params.id;
    
    console.log(email);
    res.render('authentification/changePassword',{email:email})

    
})

router.post('/changePass', async (req, res) => {
    
    const token = req.query.token;
    const findUser = await User.findOne({ _id: token })

    if (findUser){
    const {oldPass,password,email}= req.body;
    const findUser = await User.findOne({ email: email })
    if (findUser) {
        const match=cryptr.decrypt(findUser.password)
        if (match===oldPass) {
            
            const hashPassword = cryptr.encrypt(password)
           await  User.findOneAndUpdate({email:email}, {$set: {"password": hashPassword}}, {returnNewDocument: true})
res.render('authentification/changePassword',{email:email,result:'true'});
        }
        else{
            res.render('authentification/changePassword',{email:email,result:'false'});
        }
    }
    else { res.render('error')}

            

    
}
});
router.get('/findOne/:id', async (req, res) => {
    const token = req.query.token;
    const findUser = await User.findOne({ _id: token })

    if (findUser){
    const email = req.params.id;
    const myuser= await imgModel.findOne({ email: email });
    const user= await User.findOne({ email: email });
    console.log(user.name)
    res.render('authentification/userInformation',{user:user,myuser:myuser})
    }
    else{ res.render('error')}
    
})
// Json web token functionality
router.get('/dashboard/:id',loginrequired,async (req,res)=>{
    var email = req.params.id;

    const myuser= await imgModel.findOne({ email: email });
    const user= await User.findOne({ email: email });
    const pass=cryptr.decrypt(user.password);
    res.render('authentification/dashboard',{user:user,myuser:myuser,game:pass});
})
// disconnect
router.get('/logout',(req,res)=>{
    res.cookie('access-token',"", { maxAge: 1})
    res.redirect('/auth/login')
})
// SIGN UP
router.get('/register', (req, res) => {
    res.render('authentification/register')
})


router.post('/registerUser', async (req, res) => {
    try {
        const { name, email, password } = req.body
        const user = {
            name,
            email,
            password,
            emailToken: crypto.randomBytes(64).toString('hex') + email,
            isVerified: false
        }
        const hashPassword = cryptr.encrypt(password)
        user.password = hashPassword;
      
        res.render('authentification/StoreSignature',{user:user});
    }
    catch (err) {
        console.log(err);
    }
})
// login
router.get('/login',testing, (req, res) => {
   // res.render('authentification/login');
})
router.post('/login', verifyEmail, async (req, res) => {
    try {
        const { email, password } = req.body
        const findUser = await User.findOne({ email: email })
        if (findUser) {
            const match=cryptr.decrypt(findUser.password)
            if (match===password) {
                // crate Token
                const token = createToken(findUser.id)
                console.log(token)
                // store token in cookie 
                res.cookie('access-token', token);
                const string=email;
                if(email==process.env.manager){ res.redirect('/admin/listUsers?valid=' + string); }
                else {
                res.redirect(`/auth/dashboard/${string}`);}
            }
            else { console.log('wrong password') 
            res.render('authentification/login',{result:'false'});
        }
        }
        else { console.log('wrong password ') 
        res.render('authentification/login',{result:'false'});

    }
    }
    catch (err) {
        console.log(err);
        res.render('error');
    }
})

// sign token trick
router.get('/sign', (req, res) => {
    res.render('authentification/signPDF');
})
router.post('/sign', async (req, res) => {
    try {
        const { pdfname, email } = req.body;
        const user = await User.findOne({ email: email })
        if (user) {
            mailSending(user, pdfname);
            res.render('authentification/verification', { pdfname: pdfname, email: email });
        }
    }
    catch (err) { console.log(err) }
})
// email verfication
router.get('/verify-email', async (req, res) => {
    try {
        const token = req.query.token;
        console.log(token);
        const user = await User.findOne({ emailToken: token })
        if (user) {
            user.emailToken = null
            user.isVerified = true
            await user.save();
            res.redirect('/auth/login')
        }
        else {
            res.redirect('/auth/register')
            console.log('not verified')
        }
    }
    catch (error) {
        console.log(error);
    }
})


//Token creation:after login if user pass four hour he  will have to login again
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {expiresIn: '4h'})
}



/// setting up historic
router.get('/historic/:id', async (req, res) => {
    const token = req.query.token;
    const findUser = await User.findOne({ _id: token })

    const email = req.params.id;
    let   mail=email+'.com';
if(findUser){
  pdfModel.find({mail:mail})
            .then(data => {
                
                
                res.render('authentification/historic', { pdfusers: data });
            })
            .catch(err => {
                res.status(500).send({ message: err.message || "Error Occurred while retriving user information" })
            })}
            else { res.render('error')}
    
})

 

module.exports = router