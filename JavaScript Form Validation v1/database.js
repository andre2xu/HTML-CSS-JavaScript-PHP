const mysql = require('mysql');

var db_connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "login_test" //my sample table
})

db_connection.connect((err) => {
    if (err) throw err;

    console.log("Successfully connected to database.");
})

module.exports = db_connection;