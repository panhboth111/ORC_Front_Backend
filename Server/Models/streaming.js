const mongoose = require('mongoose');

const schema = mongoose.Schema({
    code : {
        type : String,
        required : true
    },
    streamCode : {
        type : String,
        required : true
    },
    streamTitle : {
        type : String,
        required : true
    },
    owner : {
        type : String,
        required : true
    },
    date : {
        type : Date,
        default : Date.now
    }
})


module.exports = mongoose.model('Streamings', schema)