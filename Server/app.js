const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require('body-parser')
const cors = require('cors')
const Device = require('./Models/device')
const Class = require('./Models/class')
require('dotenv/config');

const PORT = 3000 || process.env.PORT 

const app = express();
const server = app.listen(PORT,()=> {
    console.log(`listening on port ${PORT}`)
    
})
const io = require('socket.io')(server)

// Import Routes
const userRoute = require("./routes/users")
const authRoute = require("./routes/auth")

//MiddleWare
app.use(bodyparser.json())
app.use(cors())
app.use("/users",userRoute)
app.use("/auth",authRoute)


// Routes
app.get(' ', (req, res) => {
    res.send("We are on home!");
});


//Connect to DB
const DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://localhost:27017/myapp'
mongoose.connect(DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true},() => console.log("Database connection established"));

//Device connection

io.on('connection',(device)=>{
    console.log(`device ${device.id} connected`)
    //recieve information about the connected device, insert into collection and save into db
    device.on('device_info',async (device_info)=>{
        device_info.deviceId = device.id
        const _device = await Device.find({deviceName:device_info.deviceName})
        const _class = await Class.find({classroomName:device_info.deviceName})
        //check if device already exists (a newly added device or an old one)
        //if it already exists, change its respective class's name to its current id, and switch its online status to true
        if(_device.length && _class.length){
            await Device.updateOne({deviceName:device_info.deviceName},{deviceId:device_info.deviceId,online:true})
            await Class.updateOne({classroomName:device_info.deviceName},{owner:device_info.deviceId})
        }
        //else create a new class for it and insert its info into db
        else{
            device_info.deviceId = device.id
            const {deviceName,deviceId,streaming,cameraPlugged} = device_info
            const online = true
            const _Device = new Device({deviceName,deviceId,streaming,cameraPlugged,online})
            const _Class = new Class({
                classroomName: device_info.deviceName,
                code:"123",
                password:"123",
                members:[],
                owner:device_info.deviceId,
                isDevice:true
            })
            await _Device.save()
            await _Class.save()
        }
    })
    //change device online status to false when disconnect
    device.on('disconnect',async(d)=>{
        await Device.updateOne({deviceId:device.id},{online:false})
    })
    //update device information when changes such as camera on/off, start/stop streamming occur
    device.on('change_device_info',async(device_info)=>{
        const {deviceName,deviceId,streaming,cameraPlugged} = device_info
        await Device.updateOne({deviceName:deviceName},{deviceName,deviceId,streaming,cameraPlugged})
    })
})

// device-managment-related routes

//get a list of all devices
app.get('/devices',async(req,res) => res.send(await Device.find()))


//projecting
app.post('/startProjecting',(req,res)=>{
    const {ids,code} = req.body
    ids.map(id => io.to(id).emit('startProjecting',code))
})
app.post('/stopProjecting',(req,res)=> req.body.ids.map(id => io.to(id).emit('stopProjecting',"")))

//streaming
app.post('/startStreaming',(req,res)=>{
    //later
})
app.post('/stopStreaming',(req,res)=>{
    //later
})


