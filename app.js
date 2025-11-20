
const express = require('express');
const { engine } = require('express-handlebars'); // Handlebars
const session = require('express-session'); // Session
const dbPool = require('./db'); // Ambil pool dari db.js
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
   
}));
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public')); 


app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secure-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));



const adminRoutes = require('./routes/admin');

app.use('/admin', adminRoutes); 

app.get('/', (req, res) => {
    
    res.redirect('/register-user'); 
});


app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});