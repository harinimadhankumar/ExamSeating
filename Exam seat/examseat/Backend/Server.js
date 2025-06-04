const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',    // Replace with your MySQL host
    user: 'root',         // Replace with your MySQL username
    password: 'harish2005',         // Replace with your MySQL password
    database: 'exam_seating' // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit if unable to connect
    } else {
        console.log('Connected to the MySQL database.');
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Exam Seating Allotment Backend!');
});

// API endpoint to get student data
app.get('/api/students', (req, res) => {
    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data from database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
