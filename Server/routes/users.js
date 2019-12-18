const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const axio = require('axios')
const User = require("../models/user")
const Credential = require("../models/credential")
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
router.post("/class", verify , async (req , res) => {
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
        res.json({
            message : "Error Occured : " + err
        })       
    }
})

//Get user Info
router.get("/user", verify , async (req, res) => {
    const email = req.user.email
    const user = await User.findOne({email})
    res.json(user)
})

//Get data for creating class
router.post("/createclass", verify , async (req, res) => {
    // Require 2 parameters {classroomName, email}
    try{
        const code = uID(6) // Create a unique keyCode for classroom **Might be duplicated**
        const _class = new _Class({
            classroomName: req.body.classroomName,
            code: code,
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
            axio.post("http://localhost:3000/users/createclass", req.body)
        }
        res.json({
            message : err.code
        })
    }
})

router.post("/joinclass", verify , async (req, res) => {
    //Require 2 data  {email, code}
   try{
        const _class = await _Class.findOne({code : req.body.code})
        //Check if the class is actually exist
        if (_class){
            // update classParticipated in user's object 
            const updatedUser = await User.updateOne({email:req.user.email}, {$addToSet: { classParticipated: req.body.code }})
            // Add new member to the class object
            await _Class.updateOne({code : req.body.code}, {$addToSet: { members: req.user.email }})
            // Check if one array has been added or not, if not, class is already joined!
            if (updatedUser.nModified == 0){
                res.json({message : "Already join the class!"})
            }else{
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
        res.json({
            message : "Error Occured : " + err
        })
   }
})

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
        res.send({"message" : "Error Occured"})   
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