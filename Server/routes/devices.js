const axios = require('axios')
const express = require('express')
const app = express()
const router = express.Router()
const Device = require('../Models/device')
const User = require('../Models/user')
const Credential = require('../Models/credential')
const Stream = require('../Models/streaming')
const uID = require('../JS/UniqueCode')
const deviceManagement = (io) => {
    io.on('connection',async (device)=>{
        console.log(`device ${device.id} connected`)
        device.on('device_info',async (device_info)=>{
           console.log(device_info)
           //check if this is a new device. If it has the following information in the database it is not.
           const {device_name,device_id,device_streaming,camera_plugged} = device_info
           const _Device = await Device.findOne({deviceId:device_id})
           const _Credential = await Credential.findOne({email:`${device_name}@device.com`})
           const _User = await User.findOne({email:`${device_name}@device.com`})
           if(_Device && _User && _Credential){
               await Device.updateOne({deviceId:device_id},{deviceName:device_name,deviceId:device_id,socketId:device.id,streaming:device_streaming,cameraPlugged:camera_plugged,online:true})
           }//later
           else{
               try {
                const deviceName = `device-${uID(4)}`
                const deviceId = `${uID(6)}`
                await new Device({deviceName,deviceId,socketId:device.id,streaming:device_streaming,cameraPlugged:camera_plugged,online:true}).save()
                await axios.post('http://localhost:3000/auth/deviceSignUp',{email:`${deviceName}@device.com`,name:deviceName,pwd:"123456"})
                device.emit('update_device_info',{deviceName,deviceId})
               } catch (error) {
                   if(error.code == 11000){
                        const deviceName = `device-${uID(4)}`
                        const deviceId = `${uID(6)}`
                        await new Device({deviceName,deviceId,socketId:device.id,streaming:device_streaming,cameraPlugged:camera_plugged,online:true}).save()
                        await axios.post('http://localhost:3000/auth/deviceSignUp',{email:`${deviceName}@device.com`,name:deviceName,pwd:"123456"})
                        device.emit('update_device_info',{deviceName,deviceId})

                   }
               }
           }
           io.emit('info',await Device.find())
        })
        io.emit('info',await Device.find()) 
        //change the device's online status to false when it disconnects
        device.on('disconnect',async()=>{
            await Device.updateOne({socketId:device.id},{online:false})
            io.emit('info',await Device.find()) 
        })
        //update the following information into the database when changes such as device start/stop stream and camera plug/unplug occur
        device.on('change_in_device',async(device_info)=>{
            const {device_streaming,camera_plugged} = device_info
            await Device.updateOne({socketId:device.id},{streaming:device_streaming,cameraPlugged:camera_plugged})
            io.emit('info',await Device.find()) 
        })
   
    })
    


    //get routes
    router.get('/',async(req,res)=> res.send(await Device.find())) //get a list of all devices



    //put routes
    router.put('/changeName',async(req,res)=>{
        try{
            const {deviceId,deviceName} = req.body
            const socket = await Device.findOne({deviceId})
            await Device.updateOne({deviceId},{deviceName})
            await User.updateOne({deviceId},{email:`${deviceName}@device.com`})
            await Credential.updateOne({deviceId},{email: `${deviceName}@device.com`})
            io.to(socket.socketId).emit('change_name',deviceName)
            io.emit('info',await Device.find())
            res.send(socket.socketId)
        }catch(err){
            res.send({msg:err})
        }
    })

    //post routes
    router.post('/startStreaming',async (req,res)=>{
        const {deviceId,deviceIds,owner,streamTitle,description} = req.body
        if(deviceId !='None'){
            const _d = await Device.findOne({deviceId})
            io.to(_d.socketId).emit('start_streaming',{email:`${deviceId}@device.com`,password:"123456",streamTitle,description,owner})
        }
        deviceIds.map(id => {
            const _d2 = await Device.findOne({deviceId:id})
            io.to(_d2.socketId).emit('start_casting',{email:`${deviceId}@device.com`,password:"123456",streamTitle})
        })
    })


    router.post('/stopStreaming',async (req,res)=>{
        const {ownerName} = req.body
        const _Stream = await Stream.findOne({ownerName})
        const _StreamTitle = _Stream.streamTitle
        const Devices = await Devices.find({streaming: _StreamTitle})
        Devices.map(d => {
            io.to(d.socketId).emit('stop_streaming','')
        })
    })
}



module.exports.deviceManagement = deviceManagement
module.exports.deviceRoute = router