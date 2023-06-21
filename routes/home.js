const express = require('express')
const router = express.Router();
//Main routes 
router.get('/',(req,res)=>{

  res.render('home',{host:process.env.host})
  
})



module.exports=router