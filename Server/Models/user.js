const mongoose = require('mongoose');

const schema = mongoose.Schema({
    classOwnerShip : Array,
    classParticipated : Array,
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