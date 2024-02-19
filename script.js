// script.js

// function for adding a book to the database
async function addBook() {
    const form = document.getElementById('addBookForm');
    const formData = new FormData(form);

    // Convert FormData to JSON
    const jsonObject = {};
    formData.forEach((value, key) => {
        jsonObject[key] = value;
    });

    try {
        // Port fetch 
        const response = await fetch('http://localhost:3001/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonObject),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Book added successfully. BookID:', result.newBookID);
                alert('Book added successfully. BookID: ' + result.newBookID);
                // can redirect the user or perform additional actions here
            } else {
                console.error('Error adding book:', result.message);
                alert('Error adding book: ' + result.message);
            }
        } else {
            console.error('Error adding book. Status:', response.status);
            alert('Error adding book. Check the console for details.');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Error adding book. Check the console for details.');
    }
}

// Function to delete a book
async function deleteBook(bookID) {
    try {
        const response = await fetch(`http://localhost:3001/api/books/${bookID}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Book deleted successfully. BookID:', bookID);
                alert('Book deleted successfully.');
                // Remove the deleted book entry from the DOM
                const bookEntry = document.getElementById(`book-${bookID}`);
                if (bookEntry) {
                    bookEntry.remove();
                }
            } else {
                console.error('Error deleting book:', result.message);
                alert('Error deleting book: ' + result.message);
            }
        } else {
            console.error('Error deleting book. Status:', response.status);
            alert('Error deleting book. Check the console for details.');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error deleting book. Check the console for details.');
    }
}

// Function to create HTML elements for a book entry
function createBookEntry(book) {
    console.log('Book:', book); // Log the book object to inspect its structure

    const bookList = document.getElementById('bookList');

    const bookDiv = document.createElement('div');
    bookDiv.className = 'book-entry';

    // Add content to the book entry
    bookDiv.innerHTML = `
        <h2>${book.Title}</h2>
        <p>Author: ${book.Author}</p>
        <p>Genre: ${book.Genre}</p>
        <p>ISBN: ${book.ISBN}</p>
        <p>Description: ${book.Description}</p>
        <img src="${book.ImageURL}" alt="Book Cover">
        <a href="${book.PDFURL}" target="_blank">Read Book</a>
        <button onclick="deleteBook(${book.BookID})">Delete Book</button>
    `;

    // Append the book entry to the book list
    bookList.appendChild(bookDiv);
}

// Function to fetch and display all books
async function displayBooks() {
    try {
        const response = await fetch('http://localhost:3001/api/books');

        if (!response.ok) {
            console.error('Error fetching books. Status:', response.status);
            alert('Error fetching books. Check the console for details.');
            return;
        }

        const books = await response.json();

        // Clear existing book entries before displaying new ones
        const bookList = document.getElementById('bookList');
        bookList.innerHTML = '';

        books.forEach(createBookEntry);
    } catch (error) {
        console.error('Error fetching books:', error.message);
        alert('Error fetching books. Check the console for details.');
    }
}

// Call the displayBooks function when the page loads
document.addEventListener('DOMContentLoaded', displayBooks);
