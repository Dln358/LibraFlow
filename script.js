// script.js
document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayBooks(); // fetch and display books when the document is fully loaded
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
      "http://localhost:3002/api/books?ISBN=${jsonObject.ISBN}"
    );
    const { data } = await response.json();

    //statement to prevent duplicate entries
    if (data.length > 0 && data.some((book) => book.ISBN === jsonObject.ISBN)) {
      alert("This book has already been added.");
      return;
    }

    const addBookResponse = await fetch("http://localhost:3002/api/books", {
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
  const response = await fetch("http://localhost:3002/api/books");
  if (response.ok) {
    const { data } = await response.json();
    //new function
    const sorted = sortBooks(data);
    const booksContainer = document.getElementById("bookList");
    booksContainer.innerHTML = ""; // clear existing entries

    sorted.forEach(book => {
      const bookEntry = document.createElement("div");
      bookEntry.innerHTML = `
                <h3>${book.Title}</h3>
                <p>Author: ${book.Author}<br />
                Genre: ${book.Genre}<br />
                ISBN: ${book.ISBN}<br />
                Description: ${book.Description}</p>
                <img src="${
                  book.ImageURL || "path/to/default/image.png"
                }" alt="Book Image" style="width:100px;height:100px;object-fit:cover;">
                <p>PDF URL: <a href="${
                  book.PDFURL
                }" target="_blank">View PDF</a></p>
                <button class="like-btn" data-bookid="${book.BookID}">Like</button>
            `;
    
    /*data.forEach((book) => {
      const bookEntry = document.createElement("div");
      bookEntry.innerHTML = `
                <h3>${book.Title}</h3>
                <p>Author: ${book.Author}<br />
                Genre: ${book.Genre}<br />
                ISBN: ${book.ISBN}<br />
                Description: ${book.Description}</p>
                <img src="${
                  book.ImageURL || "path/to/default/image.png"
                }" alt="Book Image" style="width:100px;height:100px;object-fit:cover;">
                <p>PDF URL: <a href="${
                  book.PDFURL
                }" target="_blank">View PDF</a></p>
                <button class="like-btn" data-bookid="${book.BookID}">Like</button>
            `;*/ //old function
      booksContainer.appendChild(bookEntry);

      // add like button
      const likeButton = bookEntry.querySelector(".like-btn");
      likeButton.addEventListener('click', () => toggleLike(book.BookID));

      // add Delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteBook(book.BookID));
      bookEntry.appendChild(deleteButton);

      // add Edit button
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => loadBookForEdit(book.BookID));
      bookEntry.appendChild(editButton);
    });
  } else {
    console.error("Failed to fetch books:", await response.text());
  }
}

// function to delete a book
async function deleteBook(bookID) {
  const response = await fetch(`http://localhost:3002/api/books/${bookID}`, {
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
  const url = `http://localhost:3002/api/books/${bookId}`;
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
    const response = await fetch(`http://localhost:3002/api/books/${bookId}`, {
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
    const response = await fetch(`http://localhost:3002/api/books`);
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
function searchResultsDisplay(books) {
  const booksContainer = document.getElementById("bookList");
  booksContainer.innerHTML = ""; // Clear previous results

  books.forEach((book) => {
    const bookEntry = document.createElement("div");
    bookEntry.innerHTML = `
            <h3>${book.Title}</h3>
            <p>Author: ${book.Author}<br />
            Genre: ${book.Genre}<br />
            ISBN: ${book.ISBN}<br />
            Description: ${book.Description}</p>
            <img src="${
              book.ImageURL || "path/to/default/image.png"
            }" alt="Book Image" style="width:100px;height:100px;object-fit:cover;">
            <p>PDF URL: <a href="${
              book.PDFURL
            }" target="_blank">View PDF</a></p>
        `;
    booksContainer.appendChild(bookEntry);

    // add Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteBook(book.BookID));
    bookEntry.appendChild(deleteButton);

    // add Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => loadBookForEdit(book.BookID));
    bookEntry.appendChild(editButton);
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

  const response = await fetch("http://localhost:3002/api/users/register", {
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

  const response = await fetch("http://localhost:3002/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("userToken", data.token); // store the token
    alert("Login successful.");
    closeLoginModal();
    checkLoginState(); // update UI based on login status
  } else {
    alert(`Login failed: ${data.message}`);
  }
}

// change user view
function checkLoginState() {
  const token = localStorage.getItem("userToken");
  if (token) {
    // user is logged in UI 
    document.getElementById("loginButton").style.display = "none";
    document.getElementById("registerButton").style.display = "none";
    document.getElementById("logoutButton").style.display = "block";
  } else {
    // no user is logged in, show login and register buttons
    document.getElementById("loginButton").style.display = "block";
    document.getElementById("registerButton").style.display = "block";
    document.getElementById("logoutButton").style.display = "none";
  }
}

// listener for user login status
document.addEventListener("DOMContentLoaded", checkLoginState);

// function to remove token on logout
function logoutUser() {
  localStorage.removeItem("userToken");
  alert("You have been logged out.");
  // update UI immediately
  checkLoginState();
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

// function for liking books
async function toggleLike(bookId) {
  const token = localStorage.getItem("userToken");
  if (!token) {
      alert("Please log in to like books.");
      return;
  }
  
  const response = await fetch(`http://localhost:3002/api/books/like`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId })
  });
  
  const data = await response.json();
  if (data.success) {
    // update the button state

    // refresh the books list
      fetchAndDisplayBooks();
  } else {
      alert(data.message);
  }
}