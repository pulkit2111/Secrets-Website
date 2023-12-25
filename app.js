//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
// app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

//session 
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/secrets');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// user schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
} ,{ versionKey: false });

//passport-local-mongoose
userSchema.plugin(passportLocalMongoose);

const userDetails = new mongoose.model('registrations', userSchema);

passport.use(userDetails.createStrategy());

passport.serializeUser(userDetails.serializeUser());
passport.deserializeUser(userDetails.deserializeUser());

app.get('/', function(req, res){
    res.render("home")
})


app.get('/login', function(req, res){
    res.render("login")
})


app.get('/register', function(req, res){
    res.render("register")
})

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
})

app.post('/register', async (req, res) => {
    try {
        const newUser = new userDetails({ username: req.body.username });
        await userDetails.register(newUser, req.body.password);
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
        });
    } catch (err) {
        console.error(err);
        // Display a specific error message on the registration page
        res.render("register", { registrationError: "Registration failed. Please try again." });
    }
});

app.post('/login', async(req, res) => {
    const user = new userDetails({
        username: req.body.username,
        password: req.body.password
    }) 
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.listen(3000,function(){
    console.log("Server is running on port 3000.")
})
