// server.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'DESKTOP-EGR16SJ',
    user: 'Dylan',
    password: 'rePBetn7SLWE',
    database: 'libraflow',
});

app.use(bodyParser.json());

// API endpoint to add a new book
app.post('/api/books', (req, res) => {
    const { title, author, genre, ISBN, imageURL, pdfURL, description } = req.body;

    // Validation: Check if required fields are present
    if (!title || !author || !genre || !ISBN) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // SQL query to insert a new book
    const insertQuery = 'INSERT INTO Books (Title, Author, Genre, ISBN, ImageURL, PDFURL, Description) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [title, author, genre, ISBN, imageURL || null, pdfURL || null, description || null];

    // Execute the query
    pool.query(insertQuery, values, (error, results) => {
        if (error) {
            console.error('Error adding book:', error);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        // Return the ID of the newly added book
        const newBookID = results.insertId;
        res.json({ success: true, message: 'Book added successfully.', newBookID });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
