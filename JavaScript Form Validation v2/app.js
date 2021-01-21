const PORT = 3000;

// modules
const express = require('express');
const app = express();
const path = require('path');
const ejs = require('ejs');

// exported routes
const userAuthentication = require('./routes/authentication');

// acquiring CSS stylesheets + any images in 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/images')));

app.set('view engine', 'ejs');

// routes
app.use('/api/user', userAuthentication);

// home page
app.get('/', (req, res) => {
    res.render('index');
})

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
})
