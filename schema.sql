-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS libraflow;

-- Create the Books table
CREATE TABLE Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255),
    Author VARCHAR(255),
    Genre VARCHAR(50),
    ISBN VARCHAR(20),
    ImageURL VARCHAR(255),
    PDFURL VARCHAR(255),
    Description TEXT
);
