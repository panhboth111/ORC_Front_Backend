const axios = require('axios')
const express = require('express')
const app = express()
const router = express.Router()
const Class = require('../Models/class')
const Device = require('../Models/device')
const User = require('../Models/user')
const Credential = require('../Models/credential')
const uId = require('../JS/UniqueCode')


const deviceManagement = (io) => {
    io.on('connection',(device)=>{
        console.log(`device ${device.id} connected`)
        device.on('device_info',async (device_info)=>{
           console.log(device_info)
           //check if this is a new device. If it has the following information in the database it is not.
           const {device_name,device_id,device_streaming,camera_plugged} = device_info
           const _Device = await Device.findOne({deviceId:device_id})
           const _Class = await Class.findOne({owner:`${device_id}@device.com`})
           const _User = await User.findOne({email:`${device_id}@device.com`})
           const _Credential = await Credential.findOne({email:`${device_id}@device.com`})
           if(_Device && _Class && _User && _Credential){ //if it is not a new device, update its online status and socketId (socketId changes every socket connection)
                await Device.updateOne({deviceId:device_id},{socketId:device.id,online:true})
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
                    await new Class({
                        classroomName:device_name,
                        code:"123456",
                        password:"123456",
                        members:[],
                        owner:`${id}@device.com`,
                        isDevice:true
                    }).save()
                    await new User({
                        classOwnerShip:[],
                        classParticipated:[],
                        email:`${id}@device.com`,
                        name:device_name
                    }).save()
                    await new Credential({
                        email:`${id}@device.com`,
                        pwd:"123456",
                        role:"device",  
                    }).save()
                    const classes = await Class.find()
                    await Class.updateMany({},{$addToSet: { members: `${id}@device.com` }})
                    classes.map(async (c) => await User.updateOne({email:`${id}@device.com`},{$addToSet: { classParticipated: c.code }}) )
                    device.emit('update_id',id)                
               }catch(err){
                    if(err.code == 11000){ //if the primary keys are not unique, it will throw the 11000 error, so we need to re-insert the information
                        const id = uId(6)
                        await new Device({
                            deviceName:device_name,
                            deviceId:id,
                            socketId:device.id,
                            streaming:device_streaming,
                            cameraPlugged:camera_plugged,
                            online:true
                        }).save()
                        await new Class({
                            classroomName:device_name,
                            code:"123456",
                            password:"123456",
                            members:[],
                            owner:`${id}@device.com`,
                            isDevice:true
                        }).save()
                        await new User({
                            classOwnerShip:[],
                            classParticipated:[],
                            email:`${id}@device.com`,
                            name:device_name
                        }).save()
                        await new Credential({
                            email:`${id}@device.com`,
                            pwd:"123456",
                            role:"device",  
                        }).save()
                        const classes = await Class.find()
                        await Class.updateMany({},{$addToSet: { members: `${id}@device.com` }})
                        classes.map(async c => await User.updateOne({email:`${id}@device.com`},{$addToSet: { classParticipated: c.code }}) )
                        device.emit('update_id',id)
                    }
               }
           }
        })
        //change the device's online status to false when it disconnects
        device.on('disconnect',async()=>{
            await Device.updateOne({socketId:device.id},{online:false})
        })
        //update the following information into the database when changes such as device start/stop stream and camera plug/unplug occur
        device.on('change_in_device',async(device_info)=>{
            const {device_streaming,camera_plugged} = device_info
            await Device.updateOne({socketId:device.id},{streaming:device_streaming,cameraPlugged:camera_plugged})
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
            await Class.updateOne({deviceId},{classroomName:deviceName})
            io.to(socket.socketId).emit('change_name',deviceName)
            res.send(socket.socketId)
        }catch(err){
            res.send({msg:err})
        }
    })

    //post routes
    router.post('/startProjecting',(req,res)=>{
        //later
    })
    router.post('/stopProjecting',(req,res)=>{
        //later
    })
    router.post('/startStreaming',(req,res)=>{
        //later
    })
    router.post('/stopStreaming',(req,res)=>{
        //later
    })
}



module.exports.deviceManagement = deviceManagement
module.exports.deviceRoute = router