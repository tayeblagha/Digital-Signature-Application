const mongoose = require('mongoose');
const pdfSchema = new mongoose.Schema({
    date:{
        type:Date,
        default: Date.now
    },
    mail:{
        type:String,
    },
   
   Token:{
        type:String,
    },

   
    base64:{
        type:String,
    },
    signature:{
        type:String,
    },
    

})
module.exports = mongoose.model('Pdf',pdfSchema);