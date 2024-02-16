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
