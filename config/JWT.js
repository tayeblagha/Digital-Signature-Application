const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')
const User = require('../models/userModel')

const loginrequired = async(req,res,next)=>{
    const token = req.cookies['access-token']
    if (token){
        const validtoken = await jwt.verify(token, process.env.JWT_SECRET) 
        if(validtoken){
            res.user=validtoken.id
            next()

        }
        else { console.log('token expired')
        res.redirect('/auth/login')

    }
    }
    else { console.log('token not found')
    res.redirect('/auth/login')
}
   
}
const  verifyEmail= async(req,res,next)=>{
    try{
        const user = await User.findOne({email:req.body.email})
        console.log('user verification situation: '+user.isVerified );
        if(user.isVerified){next()}
        else{ res.render('AccessDenied')}  
    }
    catch(err){console.log(err)
        res.render('authentification/login',{result:'false'});

    }
}



const testing = async(req,res,next)=>{
    let info =req.query.info;
if(info!=null){  res.render('authentification/login',{info:'info'}); }
    const token = req.cookies['access-token']
    if (token){
        const validtoken = await jwt.verify(token, process.env.JWT_SECRET) 
        if(validtoken){
            res.user=validtoken.id
            console.log(validtoken.id);
            const findUser = await User.findOne({_id: validtoken.id});
            if(findUser){const string=findUser.email;
                if (string== process.env.manager){   res.redirect(`/admin/listUsers?valid=${string}`);
                next(); }
                else{
                res.redirect(`/auth/dashboard/${string}`);
                next();
                }
            }
            else{        res.render('authentification/login');
        }

        }
        else { console.log('token expired')
        res.render('authentification/login');
    }
    }
    else { console.log('token not found')
    res.render('authentification/login');}
   
}
module.exports = { loginrequired,verifyEmail,testing}