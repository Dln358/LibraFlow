// script.js

// add books function 
async function addBook() {
    const form = document.getElementById('addBookForm');
    const formData = new FormData(form);

    // Convert FormData to JSON
    const jsonObject = {};
    formData.forEach((value, key) => {
        jsonObject[key] = value;
    });

    try {
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
                // Reset the form
                form.reset();
                // refresh the book list to include the new book
                fetchAndDisplayBooks();
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

// display books function 
async function fetchAndDisplayBooks() {
    try {
        const response = await fetch('http://localhost:3001/api/books');
        if (response.ok) {
            const { data } = await response.json();
            const booksContainer = document.getElementById('bookList');
            booksContainer.innerHTML = ''; // Clear existing entries
            data.forEach(book => {
                const bookEntry = document.createElement('div');
                bookEntry.innerHTML = `
                    <h3>${book.Title}</h3>
                    <p>Author: ${book.Author}</p>
                    <p>Genre: ${book.Genre}</p>
                    <p>ISBN: ${book.ISBN}</p>
                    <button onclick="deleteBook(${book.BookID})">Delete</button>
                `;
                booksContainer.appendChild(bookEntry);
            });
        } else {
            console.error('Failed to fetch books:', response.status);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// delete function 
async function deleteBook(bookID) {
    try {
        const response = await fetch(`http://localhost:3001/api/books/${bookID}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            alert('Book deleted successfully.');
            fetchAndDisplayBooks(); // Refresh the book list
        } else {
            alert('Error deleting book. Check the console for details.');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error deleting book. Check the console for details.');
    }
}

// call this function when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);
