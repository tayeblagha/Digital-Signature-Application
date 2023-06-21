  
var mongoose = require('mongoose');
  
var imageSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    publicKey:String,
    privateKey: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});
  
//Image is a model which has a schema imageSchema
  
module.exports = new mongoose.model('Image', imageSchema);