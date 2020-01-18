const axios = require('axios')
const express = require('express')
const app = express()
const router = express.Router()
const Device = require('../Models/device')
const uId = require('../JS/UniqueCode')


const deviceManagement = (io) => {
    io.on('connection',async (device)=>{
        console.log(`device ${device.id} connected`)
        device.on('dcon',async (msg)=> io.emit('info',await Device.find()))
        device.on('device_info',async (device_info)=>{
           console.log(device_info)
           //check if this is a new device. If it has the following information in the database it is not.
           const {device_name,device_id,device_streaming,camera_plugged} = device_info
           const _Device = await Device.findOne({deviceId:device_id})
           if(_Device){ //if it is not a new device, update its online status and socketId (socketId changes every socket connection)
                await Device.updateOne({deviceId:device_id},{socketId:device.id,online:true})
                device.emit('info',await Device.find())
           }
           else{ //else insert it into the database as a new device which is required to have the following information
               try{
                    const id = uId(6)
                    await new Device({
                        deviceName:device_name,
                        deviceId:id,
                        socketId:device.id,
                        streaming:device_streaming,
                        cameraPlugged:camera_plugged,
                        online:true
                    }).save()
                    device.emit('update_id',id)         
               }catch(err){
                    if(err.code == 11000){ //if the primary key is not unique, it will throw the 11000 error, so we need to re-insert the information
                        const id = uId(6)
                        await new Device({
                            deviceName:device_name,
                            deviceId:id,
                            socketId:device.id,
                            streaming:device_streaming,
                            cameraPlugged:camera_plugged,
                            online:true
                        }).save()
                        device.emit('update_id',id)
                    }
               }
           }
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
            io.to(socket.socketId).emit('change_name',deviceName)
            io.emit('info',await Device.find())
            res.send(socket.socketId)
        }catch(err){
            res.send({msg:err})
        }
    })

    //post routes
    router.post('/startProjecting',(req,res)=>{
        const {ids,code} = req.body
        ids.map(async (deviceId) => {
            const _device = await Device.findOne({deviceId})
            io.to(_device.socketId).emit('start_projecting',code)
        })
        res.send("done")
    })
    router.post('/stopProjecting',(req,res)=>{
        const {ids} = req.body
        ids.map(async (deviceId) => {
            const _device = await Device.findOne({deviceId})
            io.to(_device.socketId).emit('stop_projecting','')
        })
        res.send("done")
    })
    router.post('/startStreaming',async (req,res)=>{
        const {id,code} = req.body
        const _device = await Device.findOne({deviceId:id}) 
        io.to(_device.socketId).emit('start_streaming',code)
        res.send("done")
    })
    router.post('/stopStreaming',async (req,res)=>{
        const {id} = req.body
        const _device = await Device.findOne({deviceId:id}) 
        io.to(_device.socketId).emit('stop_streaming')
        res.send("done")
    })
}



module.exports.deviceManagement = deviceManagement
module.exports.deviceRoute = router