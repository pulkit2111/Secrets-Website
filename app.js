//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/secrets');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

console.log(process.env.SECRET);

// user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
} ,{ versionKey: false });

const userDetails = new mongoose.model('registrations', userSchema);

app.get('/', function(req, res){
    res.render("home")
})


app.get('/login', function(req, res){
    res.render("login")
})


app.get('/register', function(req, res){
    res.render("register")
})

app.post('/register', async(req,res) => {
    try {
        // const userData = req.body;
        const newUser = new userDetails({
            email: req.body.email,
            password: md5(req.body.password)
        });
        await newUser.save();
        res.render("secrets");
        // res.status(201).json({message: 'Registered successfully!'});
      } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
      }
})

app.post('/login', async(req, res) => {
    const email= req.body.email;
    const password = md5(req.body.password);

    try {
        const user = await userDetails.findOne({ 'email': email });

        if (!user) {
            return res.status(401).send("Invalid Username And Password.");
        }

        // Compare the encrypted form of the entered password with the stored encrypted password
        if (user.password === password) {
            // Passwords match, user is authenticated
            res.render("secrets");
        } else {
            // Passwords do not match
            res.status(401).send("Invalid Username And Password.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.post('/login', async(req,res) =>{
//     const{email, password} = req.body;

//     const existingRecord = await userDetails.findOne({
//         'email': email,
//        'password' : password 
//     });

//     if(!existingRecord){
//         return res.status(401).send("Invalid Username And Password.")
//     }
//     res.render("secrets");
//     //res.status(200).send('You have successfully logged in.');
// })

app.listen(3000,function(){
    console.log("Server is running on port 3000.")
})
