const express = require('express');
const morgan = require('morgan');
const bodyparser = require("body-parser");
const cookieparser = require('cookie-parser')
const path = require('path');
const app = express();
const homeRoute = require('./routes/home')
const digiSignRoute = require('./routes/crypto')
const verifRoute = require('./routes/verif')
const crudRoute = require('./routes/adminCrud')
const authRoute = require('./routes/authentification')
const PORT = process.env.PORT || 3000
const dotenv = require('dotenv').config()
const mongoose = require('mongoose');
let crypto = require('crypto');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey');
const Jimp = require('jimp');
var fs = require('fs');
let alert = require('alert');

// log requests:option you can remove it wont affect code
//app.use(morgan('tiny'));
// cookies
app.use(cookieparser())

// parse request to body-parser
app.use(bodyparser.urlencoded({ extended: true, parameterLimit: 100000, limit: "500mb" }))
app.use(bodyparser.json())
// set view engine
app.set("view engine", "ejs")
//app.set("views", path.resolve(__dirname, "views/ejs"))
//load assets
app.use('/css', express.static(path.resolve(__dirname, "assets/css")))
app.use('/img', express.static(path.resolve(__dirname, "assets/img")))
app.use('/js', express.static(path.resolve(__dirname, "assets/js")))
app.use('/vendor', express.static(path.resolve(__dirname, "assets/vendor")))
// db connect 
mongoose.connect(process.env.MONGODB_URL, {})
    .then((connect) => { console.log('connected to db') })
    .catch(err => { console.log(err) })
//Setting Routes
app.use('/', homeRoute);
app.use('/digitalSignature', digiSignRoute);
app.use('/admin', crudRoute);
app.use('/auth', authRoute);
app.use('/verif', verifRoute);

// set up multer middleware for storing uploaded signature image  
var multer = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'storedImages')
    },
    filename: (req, file, cb) => {
        cb(null, req.body.email + '.png')
    }
});
var upload = multer({ storage: storage });
// load the mongoose model 
var imgModel = require('./models/cryptoModel')
const User = require('./models/userModel')
// Storing Signature image
app.get('/storeSignature', (req, res) => {
    res.render('Signature/StoreSignature');
}
);
// POST handler for processing the uploaded file 
app.post('/storeSignature', upload.single('image'), async (req, res, next) => {
    const { name, email, password, emailToken, isVerified } = req.body;
    const user = new User({
        name,
        email,
        password,
        emailToken,
        isVerified: false
    })
    const newUser = await user.save()
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'der', }, privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    })
    var obj = {
        email,
        publicKey: publicKey.toString('base64'),
        privateKey: privateKey.toString('base64'),
        img: {
            data: fs.readFileSync(path.join(__dirname + '/storedImages/' + req.file.filename)),
            contentType: 'image/png'
        }
    }
    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            // item.save();

            const message = 'User Created successfully you need to wait for permission from Admin in order to connect!'
            alert(message);
            resize(email);
            res.redirect('/auth/login?info=success');
        }
    });
});
// admin creation
async function createAdmin() {
    const user = await User.findOne({ email: process.env.manager });
    if (!user) {
        const user = new User({
            name: 'admin',
            email: 'admin@gmail.com',
            password: '123456',
            emailToken: crypto.randomBytes(64).toString('hex') + process.env.manager,
            isVerified: true
        })

        const hashPassword = cryptr.encrypt(user.password);
        user.password = hashPassword;
        const newUser = await user.save()

    }
}
createAdmin();
// resizing Signature image to 50,50 pixel
async function resize(email) { // Function name is same as of file name
    // Reading Image
    const image = await Jimp.read
        (`./storedImages/${email}.png`);
    image.resize(50, 50, function (err) {
        if (err) throw err;
    })
        .write(`./storedImages/${email}.png`);
}
// listening Port
app.listen(PORT, () => { console.log(`Server is running on  ${process.env.host} `) });


/* 
// if you want to retrieve image from db by id you can consider this one
app.get('/findOne/:id', (req, res) => {
    const id = req.params.id;
     imgModel.findOne( {_id: id}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('Signature/drawSignForm', { image: items });
        }
    });
});

// optional just wanting to test redirect with item
app.get('/category', function(req, res) {
const string  = {firstName:"John", lastName:"Doe", age:50, eyeColor:"blue"};
  res.redirect('/test?valid=' + string);
  });
  app.get('/test', function(req, res) {
    var passedVariable = req.query.valid;
    console.log(passedVariable.firstName);
res.redirect('/auth/login');
    // Do something with variable
  });


*/
