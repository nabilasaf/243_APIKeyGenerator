const express = require('express');
const session = require('express-session');
const dbPool = require('./db'); 
const dotenv = require('dotenv');
const path = require('path'); 
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
const publicRoutes = require('./routes/public');

const VIEWS_DIR = path.join(__dirname, 'public'); 

app.get('/', (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, 'register_user.html')); 
});
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, 'dashboard.html')); 
});

app.get('/admin/register', (req, res) => {
    const filePath = path.join(VIEWS_DIR, 'admin_register.html');
    console.log('Mencari file di:', filePath); 
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error menyajikan file:', err.message);
            if (err.code === 'ENOENT') {
                 res.status(404).send('File not found: Check file path/name');
            } else {
                 res.status(500).send('Server error');
            }
        }
    });
});
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, 'admin_login.html')); 
});

app.use('/admin', adminRoutes); 
app.use('/api', publicRoutes); 



app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});