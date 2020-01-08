const mongoose = require('mongoose')

const schema = mongoose.Schema({
    deviceName:String,
    deviceId:String,
    streaming:Boolean,
    cameraPlugged:Boolean,
    online:false
})

module.exports = mongoose.model('Devices',schema)