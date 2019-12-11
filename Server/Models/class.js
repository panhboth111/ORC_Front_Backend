const mongoose = require('mongoose');

const schema = mongoose.Schema({
    classroomName: String,
    code: String,
    currentlyStreaming: {
        type : String,
        default : ""
    },
    members: Array,
    owner: String
})


module.exports = mongoose.model('Classes', schema)