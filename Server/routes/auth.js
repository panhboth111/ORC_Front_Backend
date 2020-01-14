const express = require('express')
const app = express()
const router = express.Router();
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require("../Models/user")
const Credential = require("../Models/credential")
const _Class = require("../Models/class")


//Get Data for sign up
router.post("/signUp", async (req , res ) => {
    await bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.pwd, salt, async (err, hash) => {
            if (err) return res.json({err})

            try{
                const user = new User({
                    classOwnerShip : [],
                    classParticipated : [],
                    email : req.body.email,
                    name : req.body.name
                });
                const credential = new Credential({
                    email : req.body.email,
                    pwd : hash
                })
                console.log(user)        
                const savedUser = await user.save();
                const savedCredential = await credential.save();
                res.json(savedUser);
            }catch(err){
                if (err.code == 11000){
                    res.json({"message" : "Email is already registered!"})
                }
                res.json({err}) 
            }
        })
    })


})

//Login
router.post("/login", async (req , res ) => {
    const email = req.body.email
    const pwd = req.body.pwd
    // console.log(email + " " + pwd)

    const existUser = await Credential.findOne({email:email})
    //Check if the user is exist
    if (!existUser) return res.json({"message" : "Email does not exist"})
    //Get User to get the username later
    const user = await User.findOne({email})
    //Validate encrypted pass
    const validPass = bcrypt.compare(pwd , existUser.pwd , (err, isMatch) => {
        if (err) return res.json({err})
        if (isMatch){ // if the pwd matches 
            // Sign the token
            const token = jwt.sign({email : email, name: user.name, role:existUser.role}, process.env.TOKEN_SECRET)
            //Put token in the header
            return res.header("auth-token",token).json({"message" : "Login Success", "token" : token})
        }else{ // if the pwd is not match
            return res.json({"message" : "Password entered is incorrect"})
        }
    })
})

module.exports = router