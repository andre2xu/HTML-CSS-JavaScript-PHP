// modules
const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db_connection = require('../db/user');
const flash = require('connect-flash');
const session = require('express-session');

// acquiring CSS stylesheets + any images in 'public' directory
router.use(express.static(path.join(__dirname, '../public')));
router.use(express.static(path.join(__dirname, '../public/images')));
router.use(express.static(path.join(__dirname, '../views')));

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(session({
    secret: 'shhh',
    cookie: {maxAge: 1000 * 60 * 60 * 24}, // this cookie lasts 1 day
    resave: false,
    saveUninitialized: false
}));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash()); 

passport.serializeUser(function(user, done) {
    done(null, user[0].username); // "user" parameter grabs an object from a done function if that function was returned successful in one of the local strategies below; it stores the specified user info in the session
})
passport.deserializeUser(function(username, done) {
    
    db_connection.query('SELECT * FROM accounts WHERE username = ?', [username], (err, result) => {
        if (err) throw err;

        done(null, result); // obj data is stored in req.user
    })
})

// login page
router.get('/login', (req, res) => {
    res.render('login', {message1: req.flash('failure1'), message2: req.flash('failure2')}); // the flash message that gets displayed depends on whether there was a mistake in the username or password
})

router.post('/login', passport.authenticate('local-login', 
    {
        successRedirect: '/api/user/profile',
        failureRedirect: '/api/user/login',
        successFlash: true,
        failureFlash: true
    },
))

passport.use('local-login', new LocalStrategy(
    {passReqToCallback: true},

    (req, username, password, done) => {

        // database query checks for the existence of the username
        db_connection.query('SELECT * FROM accounts WHERE username = ?', [username], (err, result) => {
            if (err) throw err;

            // if user exists then the password given is authenticated as well
            if (result.length) {
                bcrypt.compare(password, result[0].password, (err, hash_result) => {
                    if (err) throw err; 

                    if (hash_result) {
                        return done(null, result); // passes obj data after successful authentication
                    } else if (!hash_result) {
                        return done(null, false, req.flash('failure1', 'Incorrect password'));
                    }
                })
            } else if (!result.length) {
                return done(null, false, req.flash('failure2', 'Incorrect username')); // this sends a flash message when the username doesn't exist
            }
        })
    }
))

// register page
router.get('/register', (req, res) => {
    res.render('register', {message: req.flash('failure')}); // this flash message gets displayed when a username is taken
})

router.post('/register', passport.authenticate('local-signup',
    {
        successRedirect: '/api/user/login',
        failureRedirect: '/api/user/register',
        failureFlash: true
    }
))

passport.use('local-signup', new LocalStrategy(
    {passReqToCallback: true},

    (req, username, password, done) => {
        
        // first query checks if the username already exists in the database
        db_connection.query('SELECT * FROM accounts WHERE username = ?', [username], (err, result) => {
            if (err) throw err;

            if (!result.length) {
                let saltRounds = 10;

                bcrypt.hash(password, saltRounds, (err, hash) => {
                    if (err) throw err;

                    // if the username is available then the second query inserts the new username & password into the database
                    db_connection.query('INSERT INTO accounts (username, password) VALUES (?, ?)', [username, hash], (err) => {
                        if (err) throw err;

                        // third query is used by the serializer above for retreiving user info from the database
                        db_connection.query('SELECT * FROM accounts WHERE username = ?', [username], (err, result) => {
                            if (err) throw err;

                            return done(null, result);
                        })
                    })
                })
            } else if (result.length) {
                return done(null, false, req.flash('failure', 'That username already exists')); // this sends a flash message if the username already exists
            }
        })
    }
))

// user profile page (only accessible after successful login)
router.get('/profile', (req, res) => {
    res.render('profile', {username: req.user[0].username}); // the data in req.user comes from the deserializer above
})

module.exports = router;
