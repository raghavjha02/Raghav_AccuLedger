require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'acculedger_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'acculedger'
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL Database");
});

// Register User
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).send("Error in Signup");
        res.redirect('/login_1.html');
    });
});

// Login User
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).send("Error in Login");

        if (results.length > 0) {
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                req.session.user = results[0];
                res.redirect('/Dashboard_2.html');
            } else {
                res.status(400).send("Incorrect Password");
            }
        } else {
            res.status(404).send("User Not Found");
        }
    });
});

// Forgot Password (Send Reset Email)
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).send("Error Finding User");

        if (results.length > 0) {
            const resetLink = `http://localhost:${PORT}/reset-password/${results[0].id}`;
            res.send(`Reset Password Link: ${resetLink}`);
        } else {
            res.status(404).send("User Not Found");
        }
    });
});

// Reset Password
app.post('/reset-password/:id', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err, result) => {
        if (err) return res.status(500).send("Error Resetting Password");
        res.redirect('/login_1.html');
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/home.html');
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
