const mongoose = require('mongoose');

const schema = mongoose.Schema({
    streamCode : {
        type : String,
        required : true
    },
    streamTitle : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    isPrivate : {
        type : String,
        default : false
    },
    password : {
        type : String,
        default : ""
    },
    owner : {
        type : String,
        required : true
    },
    ownerName :{
        type : String,
        required : true
    },
    date : {
        type : Date,
        default : Date.now
    }
})


module.exports = mongoose.model('CurrentlyStreamings', schema)