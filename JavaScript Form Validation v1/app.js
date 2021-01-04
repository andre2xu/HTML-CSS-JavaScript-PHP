// modules
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mydb = require('./database');
const bcrypt = require('bcrypt');

// routes
const loginRoute = require('./routes/login.js');
const registerRoute = require('./routes/register.js');

// app.uses (extras)
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// app.uses (routes)
app.use('/login', loginRoute);
app.use('/register', registerRoute);

// --- THIS IS FOR REGISTER PAGE ---
app.post('/', (req, res) => {
    // password hashing
    saltRounds = 10;

    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) throw err;

        // SQL queries
        var $query1 = 'INSERT INTO accounts (username, password) VALUES ("'+ req.body.username +'", "'+ hash +'")';

        mydb.query($query1, (err, rows, fields) => {
            if (err) {
                console.log("Query execution failed due to...", err);
            }

            console.log("Successful query execution.");
            res.redirect('/login');
        });

        // closes database connection after query execution
        mydb.end();
    })
})

// --- THIS IS FOR LOGIN PAGE ---
app.get('/', (req, res) => {
    var user = req.query.username;
    var pass = req.query.password;

    var $query2 = 'SELECT username, password FROM accounts';

    mydb.query($query2, (err, result) => {
        if (err) throw err;

        result.forEach((e) => {
            bcrypt.compare(pass, e.password, (err, result) => {
                if (err) throw err;
                
                // authentication process
                if (user == e.username && result == true) {
                    console.log("Successfully logged in!");
                    res.redirect('/login');
                } else {
                    console.log("Rechecking...");
                }
            })
        });

        // closes database connection after authentication
        mydb.end();
    })
})

app.listen(3000, () => {
    console.log("Server is live... listening on port 3000...")
})
