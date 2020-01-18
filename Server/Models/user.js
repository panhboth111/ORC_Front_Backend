const mongoose = require('mongoose');

const schema = mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    name : {
        type : String,
        require : true
    },
})


module.exports = mongoose.model('Users', schema)