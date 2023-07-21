const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
   title : String ,
   subtitle : String ,
   content : String ,
   imagepath : String ,
   author : {
    type : mongoose.SchemaTypes.ObjectId ,
    ref : 'User'
   } ,
},{timestamps : true})

module.exports = mongoose.model('Post',postSchema)