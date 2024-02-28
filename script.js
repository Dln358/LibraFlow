// script.js

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayBooks(); // fetch and display books when the document is fully loaded
});

// function to add a new book
async function addBook() {
    const form = document.getElementById('addBookForm');
    const formData = new FormData(form);
    const jsonObject = {};

    formData.forEach((value, key) => { jsonObject[key] = value; });

    try {
        const response = await fetch('http://localhost:3001/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonObject),
        });

        if (response.ok) {
            alert('Book added successfully.');
            form.reset(); // reset the form after successful submission
            fetchAndDisplayBooks(); // refresh the book list to include the new book
        } else {
            alert('Error adding book. Please check the console for details.');
            console.error('Error adding book:', await response.text());
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Error adding book. Check the console for details.');
    }
}

// function to fetch and display books
async function fetchAndDisplayBooks() {
    const response = await fetch('http://localhost:3001/api/books');
    if (response.ok) {
        const { data } = await response.json();
        const booksContainer = document.getElementById('bookList');
        booksContainer.innerHTML = ''; // clear existing entries

        data.forEach(book => {
            const bookEntry = document.createElement('div');
            bookEntry.innerHTML = `
                <h3>${book.Title}</h3>
                <p>Author: ${book.Author}</p>
                <p>Genre: ${book.Genre}</p>
                <p>ISBN: ${book.ISBN}</p>
                <p>Description: ${book.Description}</p>
                <img src="${book.ImageURL || 'path/to/default/image.png'}" alt="Book Image" style="width:100px;height:100px;object-fit:cover;">
                <p>PDF URL: <a href="${book.PDFURL}" target="_blank">View PDF</a></p>
            `;
            booksContainer.appendChild(bookEntry);

            // add Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteBook(book.BookID));
            bookEntry.appendChild(deleteButton);

            // add Edit button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => loadBookForEdit(book.BookID));
            bookEntry.appendChild(editButton);
        });
    } else {
        console.error('Failed to fetch books:', await response.text());
    }
}

// Function to delete a book
async function deleteBook(bookID) {
    const response = await fetch(`http://localhost:3001/api/books/${bookID}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        alert('Book deleted successfully.');
        fetchAndDisplayBooks(); // refresh the book list
    } else {
        alert('Error deleting book. Check the console for details.');
        console.error('Error deleting book:', await response.text());
    }
}

// function to load book details into the editing form and show the modal
async function loadBookForEdit(bookId) {
    const url = `http://localhost:3001/api/books/${bookId}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Book not found');
        }
        const { data } = await response.json();
        document.getElementById('edit-title').value = data.Title;
        document.getElementById('edit-author').value = data.Author;
        document.getElementById('edit-genre').value = data.Genre;
        document.getElementById('edit-ISBN').value = data.ISBN;
        document.getElementById('edit-imageURL').value = data.ImageURL || '';
        document.getElementById('edit-pdfURL').value = data.PDFURL || '';
        document.getElementById('edit-description').value = data.Description;
        document.getElementById('edit-bookId').value = bookId;

        document.getElementById('editBookModal').style.display = 'block';
    } catch (error) {
        console.error('Failed to fetch book details:', error);
        alert('Error loading book for editing. Please try again.');
    }
}

// function to edit book
async function updateBook(event) {
    event.preventDefault(); // prevent the default form submission behavior

    const bookId = document.getElementById('edit-bookId').value;
    const updatedBookData = {
        title: document.getElementById('edit-title').value,
        author: document.getElementById('edit-author').value,
        genre: document.getElementById('edit-genre').value,
        ISBN: document.getElementById('edit-ISBN').value,
        imageURL: document.getElementById('edit-imageURL').value,
        pdfURL: document.getElementById('edit-pdfURL').value,
        description: document.getElementById('edit-description').value
    };

    try {
        const response = await fetch(`http://localhost:3001/api/books/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBookData),
        });

        if (!response.ok) {
            throw new Error('Failed to update the book');
        }

        alert('Book updated successfully.');
        closeModal(); // close the edit modal
        fetchAndDisplayBooks(); // refresh the book list to display the updated data
    } catch (error) {
        console.error('Failed to update book:', error);
        alert('Error updating book. Please try again.');
    }
}

// function to hide the edit modal
function closeModal() {
    document.getElementById('editBookModal').style.display = 'none';
}

// function to listen for modal close on outside click
window.onclick = function(event) {
    if (event.target == document.getElementById('editBookModal')) {
        closeModal();
    }
};