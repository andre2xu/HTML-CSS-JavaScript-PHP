// modules
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mydb = require('./database');

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
    // SQL queries
    var $query1 = 'INSERT INTO accounts (username, password) VALUES ("'+ req.body.username +'", "'+ req.body.password +'")';

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

// --- THIS IS FOR LOGIN PAGE ---
app.get('/', (req, res) => {
    var user = req.query.username;
    var pass = req.query.password;

    // SQL queries
    var $query2 = 'SELECT username, password FROM accounts';

    mydb.query($query2, (err, result) => {
        if (err) throw err;

        for (let i = 0; i < result.length; i++) {
            if (user == result[i].username && pass == result[i].password) {
                console.log("Succesfully logged in.");
                res.redirect('/login');
                break;
            } else if (user != result[i].username && pass != result[i].password) {
                console.log("Rechecking...");
                continue;
            } else {
                console.log("Invalid username or password, try again.");
                res.redirect('/login');
                break;
            }
        }
    })

    mydb.end();
})

app.listen(3000, () => {
    console.log("Server is live... listening on port 3000...")
})