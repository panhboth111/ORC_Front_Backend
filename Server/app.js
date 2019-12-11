const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require('body-parser')
const cors = require('cors')
require('dotenv/config');

const app = express();


// Import Routes
const userRoute = require("./routes/users")

//MiddleWare
app.use(bodyparser.json())
app.use(cors())
app.use("/users",userRoute)

// Routes
app.get('/', (req, res) => {
    res.send("We are on home!");
});


//Connect to DB
mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true}, () => {
    console.log("Database Connected");
});


//Start Sever
app.listen(3000, function (){
    console.log("Server is running on port 3000");
});


