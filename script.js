// script.js
document.addEventListener("DOMContentLoaded", () => {
  closeLoginModal();
  closeRegisterModal();
  closeEmailModal();
  closePasswordModal();
  fetchAndDisplayBooks(); // fetch and display books when the document is fully loaded
  updateUsernameDisplay();
});

// function to add a new book
async function addBook() {
  const form = document.getElementById("addBookForm");
  const formData = new FormData(form);
  const jsonObject = {};

  formData.forEach((value, key) => {
    jsonObject[key] = value;
  });

  try {
    const response = await fetch(

      "http://localhost:3001/api/books?ISBN=${jsonObject.ISBN}"

    );
    const { data } = await response.json();

    //statement to prevent duplicate entries
    if (data.length > 0 && data.some((book) => book.ISBN === jsonObject.ISBN)) {
      alert("This book has already been added.");
      return;
    }


    const addBookResponse = await fetch("http://localhost:3001/api/books", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonObject),
    });

    if (addBookResponse.ok) {
      alert("Book added successfully.");
      form.reset(); // reset the form after successful submission
      fetchAndDisplayBooks(); // refresh the book list to include the new book
    } else {
      alert("Error adding book. Please check the console for details.");
      console.error("Error adding book:", await response.text());
    }
  } catch (error) {
    console.error("Error adding book:", error);
    alert("Error adding book. Check the console for details.");
  }
}

//new function
//function to sort book titles from A-Z
function sortBooks(books) {
  return books.sort((a, b) => a.Title.localeCompare(b.Title));
}

// function to fetch and display books
async function fetchAndDisplayBooks() {
  const isLoggedIn = !!localStorage.getItem("userToken");
  let likedBooksIds = new Set();

  // If logged in, fetch liked books
  if (isLoggedIn) {
    likedBooksIds = await fetchLikedBooksIds();
  }

  const response = await fetch("http://localhost:3001/api/books");

  if (response.ok) {
    const { data } = await response.json();
    const sorted = sortBooks(data);
    const booksContainer = document.getElementById("bookList");
    booksContainer.innerHTML = ""; // clear existing entries

    sorted.forEach((book) => {
      const bookEntry = document.createElement("div");
      bookEntry.classList.add("book");
      bookEntry.innerHTML = `
          <img class="book-image" src="${book.ImageURL || "path/to/default/image.png"}" alt="Book Image">
          <div class="btns">
              <a href="${book.PDFURL}" target="_blank" class="pdf-btn">View</a>
              <button class="edit-btn" data-bookid="${book.BookID}">Edit</button>
              <button class="del-btn" data-bookid="${book.BookID}">Delete</button>
          </div>
          <button class="like-btn" data-bookid="${book.BookID}"></button>
          <button class="bookmark-btn" data-bookid="${book.BookID}"></button> <!-- Added bookmark button -->
          <div class="book-details">
              <h3>${book.Title}</h3>
              <p><strong>Author:</strong> ${book.Author}<br>
              <strong>Genre:</strong> ${book.Genre}<br>
              <strong>ISBN:</strong> ${book.ISBN}</p>
              <div class="book-description"><strong>Description:</strong> ${book.Description}</div>
          </div>
      `;
      booksContainer.appendChild(bookEntry);

      // Apply the liked state within the forEach loop
      const likeButton = bookEntry.querySelector(".like-btn");
      if (likedBooksIds.has(book.BookID.toString())) {
        likeButton.classList.add("liked");
      } else {
        likeButton.classList.remove("liked");
      }

      // Add event listener for like button
      likeButton.addEventListener("click", function () {
        toggleLike(this.getAttribute("data-bookid"), this);
      });

      // Add event listener for bookmark button
      const bookmarkButton = bookEntry.querySelector(".bookmark-btn");
      bookmarkButton.addEventListener("click", function () {
        toggleBookmark(this.getAttribute("data-bookid"), this);
      });

      // Add event listeners for delete and edit buttons
      const deleteButton = bookEntry.querySelector(".del-btn");
      deleteButton.addEventListener("click", () => deleteBook(book.BookID));

      const editButton = bookEntry.querySelector(".edit-btn");
      editButton.addEventListener("click", () => loadBookForEdit(book.BookID));
    });
  } else {
    console.error("Failed to fetch books:", await response.text());
  }
}

// function to get users liked books
async function fetchLikedBooksIds() {
  const token = localStorage.getItem("userToken");

  const response = await fetch("http://localhost:3001/api/user/liked-books", {

    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    const likedData = await response.json();
    return new Set(likedData.likedBooks.map((book) => book.BookID.toString()));
  } else {
    console.error("Failed to fetch liked books:", await response.text());
    return new Set(); // Return an empty set on failure
  }
}

// function to fetch and display liked books
async function fetchAndDisplayLikedBooks() {
  // Retrieve the JWT token
  const token = localStorage.getItem("userToken");

  const response = await fetch("http://localhost:3001/api/user/liked-books", {

    // Correct URL
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const responseBody = await response.json(); // Get the response body
    console.log(responseBody); // Log the response body to debug
    const { likedBooks } = responseBody; // Destructure likedBooks from the response
    const booksContainer = document.getElementById("bookList");
    booksContainer.innerHTML = ""; // Clear existing entries

    likedBooks.forEach((book) => {
      const bookEntry = document.createElement("div");
      bookEntry.innerHTML = `
      <div class="book">
      <img class="book-image" img src="${
        book.ImageURL || "path/to/default/image.png"
      }" alt="Book Image">
      <div class="btns">
      <a href="${book.PDFURL}" target="_blank" class="pdf-btn">View</a>
      <button class="edit-btn" data-bookid="${book.BookID}">Edit</button>
      <button class="del-btn" data-bookid="${book.BookID}">Delete</button>
      </div>
      <button class="like-btn" data-bookid="${book.BookID}"></button>
      <div class="book-details">
      <h3>${book.Title}</h3>
      <p><strong>Author:</strong> ${book.Author}<br>
      <strong>Genre:</strong> ${book.Genre}<br>
      <strong>ISBN:</strong> ${book.ISBN}</p>
      <div class="book-description"><strong>Description:</strong> ${
        book.Description
      }</div>
      </div>
      </div>
            `;
      booksContainer.appendChild(bookEntry);

      // ensure heart is red on liked books view
      const likeButton = bookEntry.querySelector(".like-btn");
      likeButton.classList.add("liked");

      // add like button
      likeButton.addEventListener("click", function () {
        toggleLike(this.getAttribute("data-bookid"), this); // Passing 'this' as the second argument
      });

      
      // Add event listeners for delete and edit buttons
      const deleteButton = bookEntry.querySelector(".del-btn");
      deleteButton.addEventListener("click", () => deleteBook(book.BookID));

      const editButton = bookEntry.querySelector(".edit-btn");
      editButton.addEventListener("click", () => loadBookForEdit(book.BookID));

    });
  } else {
    console.error("Failed to fetch liked books:", await response.text());
  }
}
async function fetchAndDisplayBooks() {
  const isLoggedIn = !!localStorage.getItem("userToken");
  let likedBooksIds = new Set();

  // If logged in, fetch liked books
  if (isLoggedIn) {
    likedBooksIds = await fetchLikedBooksIds();
  }

  const response = await fetch("http://localhost:3001/api/books");

  if (response.ok) {
    const { data } = await response.json();
    const sorted = sortBooks(data);
    const booksContainer = document.getElementById("bookList");
    booksContainer.innerHTML = ""; // clear existing entries

    sorted.forEach((book) => {
      const bookEntry = document.createElement("div");
      bookEntry.classList.add("book");
      bookEntry.innerHTML = `
          <img class="book-image" src="${book.ImageURL || "path/to/default/image.png"}" alt="Book Image">
          <div class="btns">
              <a href="${book.PDFURL}" target="_blank" class="pdf-btn">View</a>
              <button class="edit-btn" data-bookid="${book.BookID}">Edit</button>
              <button class="del-btn" data-bookid="${book.BookID}">Delete</button>
          </div>
          <button class="like-btn" data-bookid="${book.BookID}"></button>
          <button class="bookmark-btn" data-bookid="${book.BookID}"></button>
          <div class="book-details">
              <h3>${book.Title}</h3>
              <p><strong>Author:</strong> ${book.Author}<br>
              <strong>Genre:</strong> ${book.Genre}<br>
              <strong>ISBN:</strong> ${book.ISBN}</p>
              <div class="book-description"><strong>Description:</strong> ${book.Description}</div>
          </div>
      `;
      booksContainer.appendChild(bookEntry);

      // Apply the liked state within the forEach loop
      const likeButton = bookEntry.querySelector(".like-btn");
      if (likedBooksIds.has(book.BookID.toString())) {
        likeButton.classList.add("liked");
      } else {
        likeButton.classList.remove("liked");
      }

      // Add event listener for like button
      likeButton.addEventListener("click", function () {
        toggleLike(this.getAttribute("data-bookid"), this);
      });

      // Add event listener for bookmark button
      const bookmarkButton = bookEntry.querySelector(".bookmark-btn");
      const isBookmarked = checkIfBookIsBookmarked(book.BookID); // Implement this function
      bookmarkButton.textContent = isBookmarked ? "Bookmarked" : "Bookmark";
      bookmarkButton.classList.toggle("bookmarked", isBookmarked);

      bookmarkButton.addEventListener("click", function () {
        toggleBookmark(this.getAttribute("data-bookid"), this);
      });
    });
  } else {
    console.error("Failed to fetch books:", await response.text());
  }
}
// function to delete a book
async function deleteBook(bookID) {

  const response = await fetch(`http://localhost:3001/api/books/${bookID}`, {

    method: "DELETE",
  });

  if (response.ok) {
    alert("Book deleted successfully.");
    fetchAndDisplayBooks(); // refresh the book list
  } else {
    alert("Error deleting book. Check the console for details.");
    console.error("Error deleting book:", await response.text());
  }
}

// function to load book details into the editing form and show the modal
async function loadBookForEdit(bookId) {

  const url = `http://localhost:3001/api/books/${bookId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Book not found");
    }
    const { data } = await response.json();
    document.getElementById("edit-title").value = data.Title;
    document.getElementById("edit-author").value = data.Author;
    document.getElementById("edit-genre").value = data.Genre;
    document.getElementById("edit-ISBN").value = data.ISBN;
    document.getElementById("edit-imageURL").value = data.ImageURL || "";
    document.getElementById("edit-pdfURL").value = data.PDFURL || "";
    document.getElementById("edit-description").value = data.Description;
    document.getElementById("edit-bookId").value = bookId;

    document.getElementById("editBookModal").style.display = "block";
  } catch (error) {
    console.error("Failed to fetch book details:", error);
    alert("Error loading book for editing. Please try again.");
  }
}

// function to edit book
async function updateBook(event) {
  event.preventDefault(); // prevent the default form submission behavior

  const bookId = document.getElementById("edit-bookId").value;
  const updatedBookData = {
    title: document.getElementById("edit-title").value,
    author: document.getElementById("edit-author").value,
    genre: document.getElementById("edit-genre").value,
    ISBN: document.getElementById("edit-ISBN").value,
    imageURL: document.getElementById("edit-imageURL").value,
    pdfURL: document.getElementById("edit-pdfURL").value,
    description: document.getElementById("edit-description").value,
  };

  try {

    const response = await fetch(`http://localhost:3001/api/books/${bookId}`, {

      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedBookData),
    });

    if (!response.ok) {
      throw new Error("Failed to update the book");
    }

    alert("Book updated successfully.");
    closeModal(); // close the edit modal
    fetchAndDisplayBooks(); // refresh the book list to display the updated data
  } catch (error) {
    console.error("Failed to update book:", error);
    alert("Error updating book. Please try again.");
  }
}

// function to hide the edit modal
function closeModal() {
  document.getElementById("editBookModal").style.display = "none";
}

// function to listen for modal close on outside click
window.onclick = function (event) {
  if (event.target == document.getElementById("editBookModal")) {
    closeModal();
  }
};

// function to search database for a book
async function searchBooks() {
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput.value.trim().toLowerCase();

  try {

    const response = await fetch(`http://localhost:3001/api/books`);

    if (!response.ok) {
      throw new Error(`Failed to fetch books with status ${response.status}`);
    }

    const { data } = await response.json();

    if (!searchTerm) {
      // if search term is empty, display all books
      searchResultsDisplay(data);
      return;
    }

    // filter the books based on the search term matching title or ISBN
    const filteredBooks = data.filter(
      (book) =>
        book.Title.toLowerCase().includes(searchTerm) ||
        book.ISBN.toLowerCase().includes(searchTerm)
    );

    if (filteredBooks.length === 0) {
      alert("No books found matching your criteria.");
      return;
    }

    searchResultsDisplay(filteredBooks); // display function for filtered results
  } catch (error) {
    console.error("Failed to search books:", error);
    alert("Failed to perform search. Please try again.");
  }
}

// function to display search results
async function searchResultsDisplay(books) {
  const likedBooksIds = await fetchLikedBooksIds();
  const booksContainer = document.getElementById("bookList");
  booksContainer.innerHTML = ""; // Clear previous results

  books.forEach((book) => {
    const bookEntry = document.createElement("div");
    bookEntry.innerHTML = `
    <div class="book">
    <img class="book-image" img src="${
      book.ImageURL || "path/to/default/image.png"
    }" alt="Book Image">
    <div class="btns">
    <a href="${book.PDFURL}" target="_blank" class="pdf-btn">View</a>
    <button class="edit-btn" data-bookid="${book.BookID}">Edit</button>
    <button class="del-btn" data-bookid="${book.BookID}">Delete</button>
    </div>
    <button class="like-btn" data-bookid="${book.BookID}"></button>
    <div class="book-details">
    <h3>${book.Title}</h3>
    <p><strong>Author:</strong> ${book.Author}<br>
    <strong>Genre:</strong> ${book.Genre}<br>
    <strong>ISBN:</strong> ${book.ISBN}</p>
    <div class="book-description"><strong>Description:</strong> ${
      book.Description
    }</div>
    </div>
    </div>
        `;
    booksContainer.appendChild(bookEntry);

      // Apply the liked state based on fetched likedBooksIds
    const likeButton = bookEntry.querySelector(".like-btn");
    if (likedBooksIds.has(book.BookID.toString())) {
      likeButton.classList.add("liked");
    }

    //event listener for like button

    likeButton.addEventListener("click", function () {
      toggleLike(this.getAttribute("data-bookid"), this);
    });

    // Add event listeners for delete and edit buttons
    const deleteButton = bookEntry.querySelector(".del-btn");
    deleteButton.addEventListener("click", () => deleteBook(book.BookID));

    const editButton = bookEntry.querySelector(".edit-btn");
    editButton.addEventListener("click", () => loadBookForEdit(book.BookID));

  });
}

// function to clear search results and display all books
function displayAllBooks() {
  fetchAndDisplayBooks();
}

// listener for pressing enter button to initiate search
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  // trigger search on pressing Enter key
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchBooks();
    }
  });
});

// listener for the search input field
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", handleSearchInputChange);

// function to handle input change in the search input field
function handleSearchInputChange() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    // if search term is empty, display all books
    displayAllBooks();
  }
}

// function to open the Add Book modal
function openAddBookModal() {
  document.getElementById("addBookModal").style.display = "block";
}

// function to close the Add Book modal
function closeAddBookModal() {
  document.getElementById("addBookModal").style.display = "none";
}

// function to register users
async function registerUser() {
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }


  const response = await fetch("http://localhost:3001/api/users/register", {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (data.success) {
    alert("Registration successful. You can now login.");
    closeRegisterModal();
  } else {
    alert(`Registration failed: ${data.message}`);
  }
}

// function to login users
async function loginUser() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;


  const response = await fetch("http://localhost:3001/api/users/login", {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("userToken", data.token); // store the token
    updateUsernameDisplay()
    alert("Login successful.");
    closeLoginModal();
    closeRegisterModal();
    // update UI based on login status
    checkLoginState();
    applyLikedStateToBooks();
  } else {
    alert(`Login failed: ${data.message}`);
  }
}

// change user view
function checkLoginState() {
  const token = localStorage.getItem("userToken");
  if (token) {
    // User is logged in UI
    document.getElementById("loginLink").style.display = "none";
    document.getElementById("registerLink").style.display = "none";
    document.getElementById("logoutLink").style.display = "block";
    document.getElementById("changeEmailLink").style.display = "block";
    document.getElementById("changePasswordLink").style.display = "block";
  } else {
    // No user is logged in, show login and register links
    document.getElementById("loginLink").style.display = "block";
    document.getElementById("registerLink").style.display = "block";
    document.getElementById("logoutLink").style.display = "none";
    document.getElementById("changeEmailLink").style.display = "none";
    document.getElementById("changePasswordLink").style.display = "none";
  }
}

// listener for user login status
document.addEventListener("DOMContentLoaded", checkLoginState);

// function to remove token on logout
function logoutUser() {
  localStorage.removeItem("userToken");
  alert("You have been logged out.");

  // Remove 'liked' class from all like buttons
  document.querySelectorAll(".like-btn.liked").forEach((button) => {
    button.classList.remove("liked");
  });

  // update UI immediately
  checkLoginState();
  fetchAndDisplayBooks();
  resetUserName();
  closeEmailModal();
  closePasswordModal();
}

// listener for user login status
document.addEventListener("DOMContentLoaded", checkLoginState);

// register modal
function openRegisterModal() {
  document.getElementById("registerModal").style.display = "block";
}

function closeRegisterModal() {
  document.getElementById("registerModal").style.display = "none";
}

// login modal
function openLoginModal() {
  document.getElementById("loginModal").style.display = "block";
}

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}

// email modal
function openEmailModal() {
   // Make an API call to get the current user's email
   const token = localStorage.getItem("userToken"); // Retrieve the stored token
   if (!token) {
     console.log("No token found - user is likely not logged in.");
     return;
   }
 
   fetch('http://localhost:3001/api/user/email', {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   .then(response => {
     if (!response.ok) {
       throw new Error('Failed to fetch current email: ' + response.statusText);
     }
     return response.json();
   })
   .then(data => {
     // Set the current email in the modal
     if(data.success) {
       const currentEmailElement = document.getElementById('currentEmail');
       if(currentEmailElement) {
         currentEmailElement.textContent = data.email;
       } else {
         console.error('Element to display current email not found');
       }
     } else {
       console.error('Failed to fetch email:', data.message);
     }
   })
   .catch(error => {
     console.error('Error fetching current email:', error);
   });
 
   // Show the email modal
   document.getElementById("changeEmailModal").style.display = "block";
}

function closeEmailModal() {
  document.getElementById("changeEmailModal").style.display = "none";
}

// change password modal
function openPasswordModal() {
  document.getElementById("changePasswordModal").style.display = "block";
}

function closePasswordModal() {
  document.getElementById("changePasswordModal").style.display = "none";
}

// function for displaying username
function resetUserName() {
  const usernameDisplay = document.getElementById("usernameDisplay");
  if(usernameDisplay) {
    usernameDisplay.textContent = "Guest";
  } else {
    console.error("Username display element not found.")
  }
  
}

// function for displaying current email
function setCurrentEmail(email) {
  const currentEmail = document.getElementById("currentEmail");
  if (currentEmail) {
    currentEmail.textContent = email;
  } else {
    console.error("Current email element not found");
  }
}



async function changeEmail() {
  const newEmail = document.getElementById("newEmail").value;
  const token = localStorage.getItem("userToken");

  try {
    const response = await fetch("http://localhost:3001/api/user/email", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: newEmail }),
    });

    const data = await response.json(); // Parse the JSON response body

    if (response.ok) {
      alert("Email updated successfully.");
      closeEmailModal();
    } else {
      // Display an alert with the error message from the API response
      alert(data.message);
    }
  } catch (error) {
    // This catches network errors, not HTTP errors like 400 or 500
    console.error("Error updating email:", error);
    alert("An error occurred while updating the email. Please try again later.");
  }
}


async function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const token = localStorage.getItem("userToken");

  try {
    const response = await fetch("http://localhost:3001/api/user/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json(); // Get the JSON response body
    if (!response.ok) {
      throw new Error(data.message || "Failed to update password."); // Use the server's error message
    }

    alert("Password updated successfully.");
    closePasswordModal();
  } catch (error) {
    console.error("Error updating password:", error);
    alert(error.message); // Show the error message to the user
  }
}


async function fetchAndDisplayCurrentEmail() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    console.log("No token found - user is likely not logged in.");
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/user/email', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current email: ' + response.statusText);
    }

    const { email } = await response.json();
    setCurrentEmail(email);
  } catch (error) {
    console.error('Error fetching current email:', error);
    // Handle error here, such as showing a user-friendly message
  }
}

function updateUsernameDisplay() {
  const token = localStorage.getItem("userToken");
  if (!token) {
      console.log("No user token found, displaying default guest username.");
      return; // Exit if no token, continue as "Guest"
  }

  fetch("http://localhost:3001/api/user/info", {
      headers: {
          "Authorization": `Bearer ${token}`
      }
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to fetch username: ' + response.statusText);
      }
      return response.json();
  })
  .then(data => {
      if (data.success) {
          const usernameDisplay = document.getElementById("usernameDisplay");
          if (usernameDisplay) {
              usernameDisplay.textContent = data.username; // Update display with fetched username
          }
      } else {
          console.error('Failed to fetch username:', data.message);
      }
  })
  .catch(error => {
      console.error('Error in fetching username:', error);
  });
}







// function for liking books
async function toggleLike(bookId, likeButton) {
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("Please log in to like books.");
    return;
  }


  const response = await fetch(`http://localhost:3001/api/books/like`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });

  const data = await response.json();
  if (data.success) {
    likeButton.classList.toggle("liked", data.liked); // Toggle based on the liked status
  } else {
    alert(data.message);
  }
}

// function for Bookmarking books
async function toggleBookmark(bookId, bookmarkButton) {
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("Please log in to bookmark books.");
    return;
  }


  const response = await fetch(`http://localhost:3001/api/books/bookmark`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });

  const data = await response.json();
  if (data.success) {
    bookmarkButton.classList.toggle("bookmarked", data.bookmarked); // Toggle based on the liked status
  } else {
    alert(data.message);
  }
}
// Listener for switching to the Liked Books tab
document.getElementById("likedBooksTab").addEventListener("click", () => {
  fetchAndDisplayLikedBooks(); // Call fetchAndDisplayLikedBooks function
});

// Listener for switching to the Bookmarked Books tab
document.getElementById("bookmarkedBooksTab").addEventListener("click", () => {
  fetchAndDisplayBookmarkedBooks(); // Call fetchAndDisplayBookmarkedBooks function
});
// function for making users likes appear after login
async function applyLikedStateToBooks() {
  // Fetch liked book IDs for the user
  const likedBooksIds = await fetchLikedBooksIds();

  // Apply the liked class to the like buttons for liked books
  document.querySelectorAll(".like-btn").forEach(button => {
    const bookId = button.getAttribute("data-bookid");
    if (likedBooksIds.has(bookId)) {
      button.classList.add("liked");
    }
  });
}
// Function to sort books by genre in alphabetical order
function sortBooksByGenre(books) {
  const sortedBooks = [...books]; // Create a copy of the books array to avoid modifying the original
  sortedBooks.sort((a, b) => a.Genre.localeCompare(b.Genre)); // Sort books by genre
  return sortedBooks;
}

/// Function to fetch, sort, and display books by genre
async function sortByGenre() {
  try {
    const response = await fetch("http://localhost:3001/api/books");
    if (!response.ok) {
      throw new Error(`Failed to fetch books with status ${response.status}`);
    }

    const { data } = await response.json();
    const sortedBooks = sortBooksByGenre(data);
    
    // Fetch liked book IDs for the user
    const likedBooksIds = await fetchLikedBooksIds();

    // Display books with updated liked state
    displayBooks(sortedBooks, likedBooksIds);
  } catch (error) {
    console.error("Failed to sort books by genre:", error);
    alert("Failed to sort books by genre. Please try again.");
  }
}

// Function to display books with updated liked state
function displayBooks(books, likedBooksIds) {
  const booksContainer = document.getElementById("bookList");
  booksContainer.innerHTML = ""; // Clear existing entries

  books.forEach((book) => {
    const bookEntry = document.createElement("div");
    bookEntry.innerHTML = `
      <div class="book">
        <img class="book-image" src="${book.ImageURL || "path/to/default/image.png"}" alt="Book Image">
        <div class="btns">
          <a href="${book.PDFURL}" target="_blank" class="pdf-btn">View</a>
          <button class="edit-btn" data-bookid="${book.BookID}">Edit</button>
          <button class="del-btn" data-bookid="${book.BookID}">Delete</button>
        </div>
        <button class="like-btn" data-bookid="${book.BookID}"></button>
        <div class="book-details">
          <h3>${book.Title}</h3>
          <p><strong>Author:</strong> ${book.Author}<br>
          <strong>Genre:</strong> ${book.Genre}<br>
          <strong>ISBN:</strong> ${book.ISBN}</p>
          <div class="book-description"><strong>Description:</strong> ${book.Description}</div>
        </div>
      </div>
    `;
    booksContainer.appendChild(bookEntry);

    // Apply the liked state based on fetched likedBooksIds
    const likeButton = bookEntry.querySelector(".like-btn");
    if (likedBooksIds.has(book.BookID.toString())) {
      likeButton.classList.add("liked");
    }

    // Add event listener for like button
    likeButton.addEventListener("click", function () {
      toggleLike(book.BookID, this);
    });

    // Add event listeners for delete and edit buttons
    const deleteButton = bookEntry.querySelector(".del-btn");
    deleteButton.addEventListener("click", () => deleteBook(book.BookID));

    const editButton = bookEntry.querySelector(".edit-btn");
    editButton.addEventListener("click", () => loadBookForEdit(book.BookID));
  });
}