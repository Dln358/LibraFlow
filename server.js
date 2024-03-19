// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = 3002;

// Use CORS middleware
app.use(cors());

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "Dylan",
  password: "fill in",
  database: "libraflow",
});

app.use(bodyParser.json());

// Web token for json
const JWT_SECRET = "LibraFlow";

// authenticate token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer TOKEN"
  if (!token) return res.sendStatus(401); // unauthorized if token is missing

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // forbidden if token is invalid
    req.user = user;
    next();
  });
}

// API endpoint to add a new book
app.post("/api/books", (req, res) => {
  const { title, author, genre, ISBN, imageURL, pdfURL, description } =
    req.body;

  // Validation: Check if required fields are present
  if (!title || !author || !genre || !ISBN) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  // SQL query to insert a new book
  const insertQuery =
    "INSERT INTO Books (Title, Author, Genre, ISBN, ImageURL, PDFURL, Description) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    title,
    author,
    genre,
    ISBN,
    imageURL || null,
    pdfURL || null,
    description || null,
  ];

  // execute the query
  pool.query(insertQuery, values, (error, results) => {
    if (error) {
      console.error("Error adding book:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
    // return the ID of the newly added book
    const newBookID = results.insertId;
    res.json({ success: true, message: "Book added successfully.", newBookID });
  });
});

// API endpoint to get books for displaying
app.get("/api/books", (req, res) => {
  const selectQuery = "SELECT * FROM Books";
  pool.query(selectQuery, (error, results) => {
    if (error) {
      console.error("Error fetching books:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
    res.json({ success: true, data: results });
  });
});

// API endpoint for deleting books
app.delete("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const deleteQuery = "DELETE FROM Books WHERE BookID = ?";
  pool.query(deleteQuery, [id], (error, results) => {
    if (error) {
      console.error("Error deleting book:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found." });
    }
    res.json({ success: true, message: "Book deleted successfully." });
  });
});

// API endpoint to get a single book by its ID
app.get("/api/books/:id", (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM Books WHERE BookID = ?", [id], (error, results) => {
    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
    if (results.length > 0) {
      res.json({ success: true, data: results[0] });
    } else {
      res.status(404).json({ success: false, message: "Book not found" });
    }
  });
});

// API endpoint for editing books
app.put("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, genre, ISBN, imageURL, pdfURL, description } =
    req.body;

  // SQL query to update a book
  const updateQuery =
    "UPDATE Books SET Title = ?, Author = ?, Genre = ?, ISBN = ?, ImageURL = ?, PDFURL = ?, Description = ? WHERE BookID = ?";

  pool.query(
    updateQuery,
    [title, author, genre, ISBN, imageURL, pdfURL, description, id],
    (error, results) => {
      if (error) {
        console.error("Error updating book:", error);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Book not found." });
      }
      res.json({ success: true, message: "Book updated successfully." });
    }
  );
});

// API endpoit for user registration
app.post("/api/users/register", async (req, res) => {
  const { username, password, email } = req.body;

  // check for existing user by username
  const existingUserQuery = "SELECT * FROM Users WHERE Username = ? LIMIT 1";
  pool.query(existingUserQuery, [username], async (error, results) => {
    if (error) {
      console.error("Error querying existing user:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }

    if (results.length > 0) {
      // username already taken, so do not proceed with registration
      return res
        .status(400)
        .json({
          success: false,
          message: "Username already taken. Please choose a different one.",
        });
    }

    // simple regex for email and password validation
    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password does not meet complexity requirements.",
        });
    }

    // proceed with registration if username is not taken
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery =
      "INSERT INTO Users (Username, Password, Email) VALUES (?, ?, ?)";

    pool.query(
      insertQuery,
      [username, hashedPassword, email],
      (insertError, insertResults) => {
        if (insertError) {
          console.error("Error creating user:", insertError);
          return res
            .status(500)
            .json({
              success: false,
              message: "Internal server error while creating user.",
            });
        }
        res.json({ success: true, message: "User registered successfully." });
      }
    );
  });
});

// API endpoint for user login
app.post("/api/users/login", async (req, res) => {
  const { username, password } = req.body;

  const selectQuery = "SELECT * FROM Users WHERE Username = ?";
  pool.query(selectQuery, [username], async (error, results) => {
    if (error)
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });

    if (results.length > 0) {
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.Password);
      if (passwordMatch) {
        // user authenticated, generate JWT
        const token = jwt.sign({ userID: user.UserID }, JWT_SECRET, {
          expiresIn: "2h",
        });
        res.json({ success: true, message: "Logged in successfully.", token });
      } else {
        res
          .status(401)
          .json({ success: false, message: "Incorrect password." });
      }
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  });
});

// API endpoint to authenticate token
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is protected content." });
});

// API endpoint to store user likes
app.post("/api/books/like", authenticateToken, async (req, res) => {
  const userId = req.user.userID; // Extracted from JWT
  const { bookId } = req.body;

  // Check if the book is already liked by the user
  const existingLikeQuery = "SELECT * FROM likes WHERE UserID = ? AND BookID = ?";
  pool.query(existingLikeQuery, [userId, bookId], (error, results) => {
      if (error) return res.status(500).json({ message: "Internal server error" });

      if (results.length > 0) {
          // Unlike the book
          const deleteLikeQuery = "DELETE FROM likes WHERE UserID = ? AND BookID = ?";
          pool.query(deleteLikeQuery, [userId, bookId], (error) => {
              if (error) return res.status(500).json({ message: "Internal server error" });
              res.json({ success: true, message: "Book unliked successfully." });
          });
      } else {
          // Like the book
          const insertLikeQuery = "INSERT INTO likes (UserID, BookID) VALUES (?, ?)";
          pool.query(insertLikeQuery, [userId, bookId], (error) => {
              if (error) return res.status(500).json({ message: "Internal server error" });
              res.json({ success: true, message: "Book liked successfully." });
          });
      }
  });
});

// API endpoint to get liked books details for a specific user
app.get("/api/user/liked-books", authenticateToken, async (req, res) => {
  const userId = req.user.userID; // Extracted from JWT
  // SQL query to join Likes and Books tables to fetch liked books details for the specified user
  const query = `
      SELECT B.BookID, B.Title, B.Author, B.Genre, B.ISBN, B.ImageURL, B.PDFURL, B.Description
      FROM Likes L
      INNER JOIN Books B ON L.BookID = B.BookID
      WHERE L.UserID = ?;
  `;

  pool.query(query, [userId], (error, results) => {
      if (error) {
          // Handle any errors during query execution
          return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length > 0) {
          // Return the list of liked books for the user
          res.json({ success: true, likedBooks: results });
      } else {
          // Handle the case where the user has not liked any books
          res.status(404).json({ success: false, message: "No liked books found for this user." });
      }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
