// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

const PORT = 3001;


// Use CORS middleware
app.use(cors());

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "JV",
  password: "123456789",
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

// API endpoint for email changes

app.put("/api/user/email", authenticateToken, async (req, res) => {
  const userId = req.user.userID; // Extracted from JWT
  const { email: newEmail } = req.body;

  // Fetch the current email from the database first
  const currentEmailQuery = "SELECT Email FROM Users WHERE UserID = ?";
  pool.query(currentEmailQuery, [userId], async (error, results) => {
    if (error) {
      console.error("Error fetching current email:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
    const currentEmail = results[0]?.Email;
    if (currentEmail === newEmail) {
      return res.status(400).json({ success: false, message: "The new email cannot be the same as the current email." });
    }

    // Simple regex for email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    // Check if email is already in use
    const emailInUseQuery = "SELECT UserID FROM Users WHERE Email = ? AND UserID <> ?";
    pool.query(emailInUseQuery, [newEmail, userId], async (error, results) => {
      if (error) {
        console.error("Error checking if email is in use:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
      }
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: "Email is already in use." });
      }

      // Update the email if it passes all checks
      const updateQuery = "UPDATE Users SET Email = ? WHERE UserID = ?";
      pool.query(updateQuery, [newEmail, userId], (error, results) => {
        if (error) {
          console.error("Error updating user email:", error);
          return res.status(500).json({ success: false, message: "Internal server error." });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "Email updated successfully." });
      });
    });
  });
});



// API endpoint for password changes

app.put("/api/user/password", authenticateToken, async (req, res) => {
  const userId = req.user.userID;  // Extracted from JWT
  const { currentPassword, newPassword } = req.body;

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: "New password cannot be the same as the current password." });
  }

  // Password complexity regex (same as in registration endpoint)
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ success: false, message: "Password does not meet complexity requirements." });
  }

  // Retrieve the current hashed password from the database
  pool.query("SELECT Password FROM Users WHERE UserID = ?", [userId], async (error, results) => {
    if (error) return res.status(500).json({ success: false, message: "Internal server error." });

    if (results.length > 0) {
      const passwordMatch = await bcrypt.compare(currentPassword, results[0].Password);
      if (passwordMatch) {
        // If the current password matches, hash the new password and update it in the database
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        pool.query("UPDATE Users SET Password = ? WHERE UserID = ?", [hashedNewPassword, userId], (error, results) => {
          if (error) return res.status(500).json({ success: false, message: "Internal server error." });
          res.json({ success: true, message: "Password updated successfully." });
        });
      } else {
        res.status(401).json({ success: false, message: "Incorrect current password." });
      }
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  });
});


// API endpoint to get the current user's email
app.get("/api/user/email", authenticateToken, (req, res) => {
  const userId = req.user.userID; // userID is extracted from the JWT

  pool.query("SELECT Email FROM Users WHERE UserID = ?", [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user email:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    // Assuming the first result is the user's email
    const email = results[0].Email;
    res.json({ success: true, email: email });
  });
});

// API endpoint to get the current user's username
app.get("/api/user/info", authenticateToken, (req, res) => {
  const userId = req.user.userID; // userID extracted from JWT in the authenticateToken middleware

  // Assuming you have a Users table with a Username column
  pool.query("SELECT Username FROM Users WHERE UserID = ?", [userId], (error, results) => {
      if (error) {
          return res.status(500).json({ success: false, message: "Internal server error" });
      }
      if (results.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, username: results[0].Username });
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
              res.json({ success: true, liked: false, message: "Book unliked successfully." });
          });
      } else {
          // Like the book
          const insertLikeQuery = "INSERT INTO likes (UserID, BookID) VALUES (?, ?)";
          pool.query(insertLikeQuery, [userId, bookId], (error) => {
              if (error) return res.status(500).json({ message: "Internal server error" });
              res.json({ success: true, liked: true, message: "Book liked successfully." });
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

// API endpoint to store user bookmarks
app.post("/api/books/bookmark", authenticateToken, async (req, res) => {
  const userId = req.user.userID; // Extracted from JWT
  const { bookId } = req.body;

  // Check if the book is already bookmarked by the user
  const existingBookmarkQuery = "SELECT * FROM bookmarks WHERE UserID = ? AND BookID = ?";
  pool.query(existingBookmarkQuery, [userId, bookId], (error, results) => {
      if (error) return res.status(500).json({ message: "Internal server error" });

      if (results.length > 0) {
          // UnBookmark the book
          const deleteBookmarkQuery = "DELETE FROM bookmarks WHERE UserID = ? AND BookID = ?";
          pool.query(deleteBookmarkQuery, [userId, bookId], (error) => {
              if (error) return res.status(500).json({ message: "Internal server error" });
              res.json({ success: true, bookmarked: false, message: "UnBookmark successfully." });
          });
      } else {
          // Bookmark the book
          const insertBookmarkQuery = "INSERT INTO bookmarks (UserID, BookID) VALUES (?, ?)";
          pool.query(insertBookmarkQuery, [userId, bookId], (error) => {
              if (error) return res.status(500).json({ message: "Internal server error" });
              res.json({ success: true, bookmarked: true, message: "Book bookmarked successfully." });
          });
      }
  });
});

// API endpoint to get bookmarked books details for a specific user
app.get("/api/user/bookmarked-books", authenticateToken, async (req, res) => {
  const userId = req.user.userID; // Extracted from JWT
  // SQL query to join Bookmarks and Books tables to fetch Bookmarked books details for the specified user
  const query = `
      SELECT B.BookID, B.Title, B.Author, B.Genre, B.ISBN, B.ImageURL, B.PDFURL, B.Description
      FROM Bookmarks L
      INNER JOIN Books B ON L.BookID = B.BookID
      WHERE L.UserID = ?;
  `;

  pool.query(query, [userId], (error, results) => {
      if (error) {
          // Handle any errors during query execution
          return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length > 0) {
          // Return the list of bookmarked books for the user
          res.json({ success: true, bookmarkedBooks: results });
      } else {
          // Handle the case where the user has not bookmarked any books
          res.status(404).json({ success: false, message: "No bookmarked books found for this user." });
      }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
