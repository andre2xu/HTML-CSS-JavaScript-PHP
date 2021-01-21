const mysql = require('mysql');

const mydb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'login_test'
})

mydb.connect((err) => {
    if (err) {
        console.log("There was a problem connecting to the database.");
    } else {
        console.log("Successfully connected to the database.");
    }
})

module.exports = mydb;
