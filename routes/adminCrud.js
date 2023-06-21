const express = require('express')
const router = express.Router()
const User = require('../models/userModel')
var imgModel = require('../models/cryptoModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose')
const crypto = require('crypto');
var pdfModel = require('../models/pdfModel');

/*Admin Mangement Crud*/
// Getting List of  Users 
router.get('/listUsers', async (req, res) => {
    var email = req.query.valid;
                const user= await User.findOne({ email: email });
    if (req.query.id) {
        const id = req.query.id;

        User.findById(id)
            .then(data => {
                if (!data) {
                    res.status(404).send({ message: "Not found user with id " + id })
                } else {
                    res.render('admin/listUsers', { users: data,host:process.env.host });
                }
            })
            .catch(err => {
                res.status(500).send({ message: "Erro retrieving user with id " + id })
            })

    } else {
        User.find()
            .then(data => {
                
                
                res.render('admin/listUsers', { users: data,user:user,host:process.env.host });
            })
            .catch(err => {
                res.status(500).send({ message: err.message || "Error Occurred while retriving user information" })
            })
    }
})
//Adding User
router.get('/add_user', (req, res) => {
    res.render('admin/add_User',{admin:process.env.admin});
})
router.post('/add_user', async (req, res) => {
    try {
        const { name, email, password, isVerified } = req.body
        const user = new User({
            name,
            email,
            password,
            emailToken: crypto.randomBytes(64).toString('hex') + email,
            isVerified
        })
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(user.password, salt)
        user.password = hashPassword;
        const newUser = await user.save()
        // send verification mail to user


        res.redirect('/admin/listUsers')
    }
    catch (err) {
        console.log(err);
    }
})
// deleting user
router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;

    User.findByIdAndDelete(id)
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `Cannot Delete with id ${id}. Maybe id is wrong` })
            } else {
                res.send({
                    message: "User was deleted successfully!"
                })
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete User with id=" + id
            });
        });
});
router.post('/deleteUser', (req, res) => {
    var email = req.query.email;
    var id = req.query.id;
    console.log(email);
    console.log(id);
    User.findByIdAndRemove(id, function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/admin/listUsers?valid='+email);
        }
    });
});
router.put('/updateStateOn/:id', async (req, res) => {
    /*   if(!req.body){
           return res
               .status(400)
               .send({ message : "Data to update can not be empty"})
       }*/

    const id = req.params.id;
    User.findByIdAndUpdate(
        { _id: id },
        [{ $set: { isVerified: { $eq: [false, "$isVerified"] } } }])
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `Cannot Update user with ${id}. Maybe user not found!` })
            } else {
                res.send(data)
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error Update user information" })
        })
});
//changing State(Active or Inactive)
router.put('/updateState/:id', async (req, res) => {
    /*   if(!req.body){
           return res
               .status(400)
               .send({ message : "Data to update can not be empty"})
       }*/

    const id = req.params.id;
    User.findByIdAndUpdate(
        { _id: id },
        [{ $set: { isVerified: { $eq: [false, "$isVerified"] } } }])
        .then(data => {
            if (!data) {
                res.status(404).send({ message: `Cannot Update user with ${id}. Maybe user not found!` })
            } else {
                res.send(data)
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error Update user information" })
        })
});




router.get('/historic/', async (req, res) => {
    const token = req.query.token;
    const email = req.query.email;
    const findUser = await User.findOne({ _id: token, email:email })
if(findUser && email==process.env.manager){
  pdfModel.find()
            .then(data => {
                
                
                res.render('authentification/historic', { pdfusers: data });
            })
            .catch(err => {
                res.status(500).send({ message: err.message || "Error Occurred while retriving user information" })
            })}
            else { res.render('error')}
    
})

module.exports = router