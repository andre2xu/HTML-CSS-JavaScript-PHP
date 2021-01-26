const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
app.use(session({
    secret: 'hidden',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Atlas connection using 'mongoose'
mongoose.connect(process.env.mongoURI, {useUnifiedTopology: true, useNewUrlParser: true})
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas.');
        app.listen(PORT, () => {console.log(`Server is running on port ${PORT}.`);})
    })
    .catch((err) => {
        console.dir(err);
    })

var db_connection = mongoose.connection; // direct connection to database (not connected to collection)

// passport.js extras
passport.serializeUser((user, done) => {
    done(null, user._id);
})
passport.deserializeUser((id, done) => {
    db_connection.db.collection('accounts', (err, collection) => {
        if (err) throw err;

        collection.findOne({_id: ObjectID(id)}, (err, user) => {
            if (err) throw err;

            return done(null, user); // object is stored in 'req.user'
        });
    })
})

// --- MAIN CODE ---
app.get('/', (req, res) => {
    res.render('index', {message: req.flash('failure'), message1: req.flash('failure1'), message2: req.flash('failure2')});
})
app.get('/user/profile', (req, res) => {
    res.render('profile', {username: req.user.username}); // redirect page for successful authentication
})


// register form
app.post('/user/register', passport.authenticate('local-register', 
    {
        failureRedirect: '/',
        failureFlash: true
    }
))
passport.use('local-register', new LocalStrategy(
    {passReqToCallback: true},

    (req, username, password, done) => {

        db_connection.db.collection('accounts', (err, collection) => {
            if (err) throw err;

            // first query checks if the username is already taken
            collection.findOne({username: username}, (err, result) => {
                if (err) throw err;

                if (!result) {
                    let saltRounds = 10;

                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if (err) throw err;

                        db_connection.db.collection('accounts', (err, collection) => {
                            if (err) throw err;

                            // second query inserts the new user into the database
                            collection.insertOne({username: username,password: hash});
                        })
                    })
                } else if (result) {
                    return done(null, false, req.flash('failure', 'That username is already taken'));
                }
            });
        })
    }
))

// login form
app.post('/user/login', passport.authenticate('local-login', 
    {
        successRedirect: '/user/profile',
        failureRedirect: '/',
        failureFlash: true
    }
))
passport.use('local-login', new LocalStrategy(
    {passReqToCallback: true},

    (req, username, password, done) => {

        db_connection.db.collection('accounts', (err, collection) => {
            if (err) throw err;

            // checks if the user exists in the database
            collection.findOne({username: username}, (err, result) => {
                if (err) throw err;

                if (!result) {
                    return done(null, false, req.flash('failure1', 'Incorrect username'));
                } 

                bcrypt.compare(password, result.password, (err, comparison_result) => {
                    if (err) throw err;

                    if (!comparison_result) {
                        return done(null, false, req.flash('failure2', 'Incorrect password'));
                    } 
                    
                    return done(null, result); // successful authentication
                })
            });
        })
    }
))