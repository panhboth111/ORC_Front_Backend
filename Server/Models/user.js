const mongoose = require('mongoose');

const schema = mongoose.Schema({
    classOwnerShip : Array,
    classParticipated : Array,
    email : String,
    name : String,
})


module.exports = mongoose.model('Users', schema)