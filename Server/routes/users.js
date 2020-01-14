const express = require('express')
const app = express()
const axio = require('axios')
const User = require("../models/user")
const Streaming = require('../Models/streaming')
const _Class = require("../models/class")
const router = express.Router();
const uID = require("../JS/UniqueCode")
const verify = require("./verifyToken")

//Routes
router.get("/", async (req , res) => {
    try{
        const user = await User.find();
        res.json(user)
    }catch(err){
        res.json({
            message : "Error Occured : " + err
        })       
    }
})

//Get all classes that student participated
router.get("/class", verify , async (req , res) => {
    try{
        const user = await User.findOne({email : req.user.email});
        const classCodes = user.classParticipated;
        const classOwned = user.classOwnerShip;
        var classParticipated = []
        var classOwnerShip = []
        // Loop through class code and retrieve each class's data from database with the help of class code
        for (i = 0; i < classCodes.length ; i++){
            var nClass = await _Class.findOne({code : classCodes[i]})
            //Seperate classOwned and ClassJoined
            if (classOwned.includes(classCodes[i])){
                classOwnerShip.push(nClass) 
            }else{
                classParticipated.push(nClass)
            }
        }
        console.log({classOwnerShip , classParticipated})
        res.json({classOwnerShip , classParticipated})
        
    }catch(err){
        res.json({err})       
    }
})

//Get user Info
router.get("/user", verify , async (req, res) => {
    const email = req.user.email
    const user = await User.findOne({email})
    res.json(user)
})

//Get data for creating class
router.post("/createClass", verify , async (req, res) => {
    // Require 2 parameters {classroomName, email}
    try{
        const code = uID(6) // Create a unique keyCode for classroom **Might be duplicated**
        const _class = new _Class({
            classroomName: req.body.classroomName,
            code: code,
            isPrivate : req.body.isPrivate,
            password : req.body.password,
            currentlyStreaming: "",
            members: [],
            owner: req.user.email
        })
        // Update user classOwnerShip and classParticipated
        const updateUser = await User.updateOne({email:req.user.email}, {$addToSet: { classOwnerShip: code , classParticipated: code} })
        if (updateUser){
            const _savedClass = await _class.save()
            res.json(_savedClass)
        }
    }catch(err /* Catching duplicate primary key error*/ ){
        if (err.code == 11000 /*11000 is Duplicate key's error code*/){
            //Simulate a the same post to forge a new unique code
            const data = axio.post("http://localhost:3000/users/createclass", req.body, { params:{}, headers: { 'auth-token': req.header('auth-token') } })
            res.json(data.data)
        }
        res.json({err})
    }
})

// Join a class
router.post("/joinClass", verify , async (req, res) => {
    //Require 2 data  {email, code}
   try{
        const _class = await _Class.findOne({code : req.body.code})


        //Check if the class is actually exist
        if (_class){
            // Check if the class is private
            if (_class.isPrivate){
                //Validate class password
                if (_class.pwd !== req.password){
                    return res.json({message : "Password incorrect"})
                }
            }           
            // update classParticipated in user's object 
            const updatedUser = await User.updateOne({email:req.user.email}, {$addToSet: { classParticipated: req.body.code }})
            // Check if one array has been added or not, if not, class is already joined!
            if (updatedUser.nModified == 0){
                res.json({message : "Already join the class!"})
            }else{
                // Add new member to the class object
                await _Class.updateOne({code : req.body.code}, {$addToSet: { members: req.user.email }})
                _class.members.push(req.user.email)
                // Send back the class
                res.json(_class)
            }
        }else{
            res.json({
                message : "Class not found!"
            })
        }
   }catch(err){
        res.json({err})
   }
})

// Delete a class
router.post("/deleteClass", verify , async (req,res)=>{
    try{
        const {code} = req.body //pull class code from request body
        
        // Check if the user own the class
        const _class = await _Class.findOne({code}) // get the desired class to delete
        if (_class.owner == req.user.email){
            await User.updateOne({email:_class.owner},{$pull:{classOwnerShip:{$in:[code]}}}) //remove ownership
            await User.updateOne({email:_class.owner},{$pull:{classOwnerShip:{$in:[code]}}}) //remove participation
            await User.updateMany({email:{$in:_class.members}},{$pull:{classParticipated:{$in:[code]}}},{multi:true}) //remove current memebers
            await _Class.deleteOne({code}) //delete class
            res.send({"message" : "Delete class as successfully"})
        }else{
            res.send({"message" : "You don't own the class"})
        }

    }catch(err){
        res.send({err})   
    }
})

// Start stream
router.post("/startStream", verify, async (req, res) => {
    const code = req.body.code
    const streamTitle = req.body.streamTitle
    const owner = req.user.email
    try{
        var streamCode = null
        var isNotUnique = null

        //Check if the class is belong to the user
        const ownClass = await _Class.findOne({code, owner})
        if (!ownClass){ //If class is not belong to user
           return res.json({"message" : "You have no rights to start streaming!"})
        }

        // Check if stream code is available 
        do{
            streamCode = code + uID(12)
            isNotUnique = await Streaming.findOne({streamCode})
        }while(isNotUnique)


        const newStream = new Streaming({
            code,
            streamCode,
            streamTitle,
            owner
        })
        const savedStream = await newStream.save()

        await _Class.updateOne({code},{currentlyStreaming:streamCode})

        res.json(savedStream)
    }catch (err){
        res.json({err})
    }
})

router.post("/joinStream", verify, async(req,res) => {
    const email = req.user.email
    const name = req.user.name
    const streamCode = req.body.streamCode
    const code = req.body.code
    const domain = 'meet.jit.si';
    
    try{
        // Get Class Info
        const _class = await _Class.findOne({code})
        
        // Check if class is actually exist
        if (!_class){
            res.json({message:"Class not found!"})
        }

        // Check if the stream is online
        if (_class.currentlyStreaming === streamCode){
            // Check ownership
            if (_class.owner === email){ // Owner
                // For Streamer/Lecturer
                const interfaceConfigLecturer = {
                    SETTINGS_SECTIONS: ['devices', 'language', 'moderator'],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                }
                const options = {
                    roomName: streamCode,
                    interfaceConfigOverwrite : interfaceConfigLecturer,
                    userInfo : {
                        email : email
                    }
                }
                res.json({options : options, domain : domain, role : "Lecturer", name : name})
            }else{ // Not-Owner
                // For Stream Participant - **Not Class Owner**
                const interfaceConfigStudent = {
                    TOOLBAR_BUTTONS: [
                        'closedcaptions', 'fullscreen',
                        'recording',
                        'etherpad', 'settings', 'raisehand',
                        'videoquality', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'download'
                    ],
                    SETTINGS_SECTIONS: ['devices', 'language', 'moderator'],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                }
                const optionsStudents = {
                    roomName: streamCode,
                    interfaceConfigOverwrite : interfaceConfigStudent,
                    userInfo : {
                        email : email
                    }
                };
                // Send Back Data Lah
                res.json({options : optionsStudents, domain : domain, role : "Student", name : name})
            }
        }else{
            res.json({message : "Stream is not available. Please Contact the streamer!"})
        }
    }catch(err){
        res.json({err})
    }

})

// Stop stream
router.post("/stopStream", verify, async (req, res) => {
    const code = req.body.code
    const owner = req.user.email
   
    try{
        await _Class.updateOne({code,owner},{currentlyStreaming : ""})
        res.json({"message" : "stopped the stream as successfully"})
    }catch(err){
        res.json({err})
    }
})

// Get currently stream of all class participated
router.get("/getCurrentStream", verify , async (req, res) => {
    try{
        const email = req.user.email
        // Get User info
        const user = await User.findOne({email})
        // Get class participated 
        const {classParticipated} = user

        // Get class ** Needed optimization for class with currently streaming not equal to nothing
        const classes = await _Class.find({code : {$in:classParticipated}})
        var streams = []
        for (var i = 0 ; i < classes.length ; i++ ){
            if (classes[i].currentlyStreaming != "" && classes[i].currentlyStreaming != null){
                streams.push(await Streaming.find({streamCode : classes[i].currentlyStreaming}))
            } // ** Need optimization, should have tackle this in the class finding for only class that has currentlystreaming not empty
        }      
        res.json(streams)
    }catch(err){
        res.json({err})
    }

})

//Get specific user (Obsolete)
router.get("/:postId", verify , async (req , res) => {
    try{
        console.log(req.params.postId)
        const user = await User.findOne({email:req.params.postId});
        res.json(user)
    }catch(err){
        res.json({
            message : "Error Occured : " + err
        })
    }

})



module.exports = router;