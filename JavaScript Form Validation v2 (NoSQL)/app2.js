const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const dotenv = require('dotenv').config();
const ejs = require('ejs');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { MongoClient, ObjectID } = require('mongodb');

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'hidden',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Atlas connection using 'mongodb' 
MongoClient.connect(process.env.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
    if (err) throw err;

    if (!err) {
        app.listen(PORT, () => {console.log(`Server is running on port ${PORT}`)});
        console.log('Successfully connected to MongoDB Atlas.');

        let db_collection = db.db('testdb').collection('accounts'); // direct connection to collection

        // passport.js extras
        passport.serializeUser((user, done) => {
            return done(null, user._id);
        })
        passport.deserializeUser((id, done) => {
            db_collection.findOne({_id: ObjectID(id)}, (err, user) => {
                if (err) throw err;

                return done(null, user); // object is stored in 'req.user'
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
                db_collection.findOne({username: username}, (err, result) => {
                    if (err) throw err;

                    if (!result) {
                        let saltRounds = 10;

                        bcrypt.hash(password, saltRounds, (err, hash) => {
                            if (err) throw err;

                            db_collection.insertOne({username: username, password: hash});
                        })
                    } else if (result) {
                        return done(null, false, req.flash('failure', 'That username already exists'));
                    }
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
                
                db_collection.findOne({username: username}, (err, result) => {
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
                })
            }
        ))
    }
})
