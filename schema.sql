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

-- If you already implemented the previous table, correct it with the following
ALTER TABLE Books
    MODIFY ISBN CHAR(13),
    ADD CONSTRAINT CHK_ISBN (ISBN>1000000000000 AND ISBN<9999999999999);