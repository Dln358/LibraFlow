# imports 
import csv
import os
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import mysql.connector
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
from joblib import load

app = Flask(__name__)

# Load the SentenceTransformer model and NearestNeighbors model
model_st = SentenceTransformer('all-MiniLM-L6-v2')  # Ensure this model is only loaded once
embeddings = load('embeddings.pkl')
model_knn = load('model_knn.pkl')

# Database configuration
db_config = {
    'user': 'Dylan',
    'password': 'fill in',
    'host': 'localhost',
    'database': 'libraflow',
    'raise_on_warnings': True
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Function to get books from database and update .csv file
def get_books():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT BookID, Title, Author, Genre, Description FROM Books")
    books = cursor.fetchall()
    cursor.close()
    conn.close()
    print("Fetched Books:", books)
    
    # Path to the CSV file
    csv_file_path = 'books.csv'
    
    # Check if the CSV file exists and read it, if not create an empty DataFrame
    if os.path.exists(csv_file_path):
        existing_data = pd.read_csv(csv_file_path)
    else:
        existing_data = pd.DataFrame(columns=['BookID', 'Title', 'Author', 'Genre', 'Description'])
    
    # Convert fetched books to DataFrame
    new_data = pd.DataFrame(books, columns=['BookID', 'Title', 'Author', 'Genre', 'Description'])
    
    # Merge new data with existing, avoiding duplicates
    combined_data = pd.concat([existing_data, new_data]).drop_duplicates(subset=['BookID']).reset_index(drop=True)
    
    # Save updated data to CSV
    combined_data.to_csv(csv_file_path, index=False)
    
    return books

# User likes function 
def get_user_likes(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT BookID FROM Likes WHERE UserID = %s", (user_id,))
    liked_books = [item[0] for item in cursor.fetchall()]
    cursor.close()
    conn.close()
    return liked_books

# API endpoint for recommending a book 
@app.route('/recommend', methods=['POST'])

# Function to make recommendation
def recommend():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    books = get_books()
    all_books = {book[0]: {"title": book[1], "author": book[2], "genre": book[3], "description": book[4]} for book in books}
    liked_books = get_user_likes(user_id)

    print("All Books:", all_books)  # Debugging
    print("Liked Books:", liked_books)  # Debugging

    # Filter book recommendations by removing users liked books
    books_to_consider = {book_id: book for book_id, book in all_books.items() if book_id not in liked_books}
    combined_texts = [f"{details['title']} {details['author']} {details['genre']} {details['description']}" for details in books_to_consider.values()]
    
    if combined_texts:
        # Encode combined texts using pre-loaded SentenceTransformer model
        book_embeddings = model_st.encode(combined_texts, show_progress_bar=True)

        # Get the embeddings for the liked books
        liked_book_texts = [all_books[book_id]['title'] + " " + all_books[book_id]['author'] + " " + all_books[book_id]['genre'] + " " + all_books[book_id]['description'] for book_id in liked_books]
        liked_book_embeddings = model_st.encode(liked_book_texts)

        # Use the pre-loaded KNN model to find the nearest neighbors
        distances, indices = model_knn.kneighbors(liked_book_embeddings, n_neighbors=3)  # Getting top 3 recommendations

        # Flatten the list of lists to get the indices
        flat_indices = indices.flatten()
        recommended_book_ids = [list(books_to_consider.keys())[i] for i in flat_indices if i < len(books_to_consider)]
        recommended_titles = [all_books[book_id]['title'] for book_id in recommended_book_ids]

        print("Recommended Book IDs:", recommended_book_ids)  # Debugging
        print("Recommended Titles:", recommended_titles)  # Debugging

        return jsonify({"recommended_titles": recommended_titles})
    else:
        return jsonify({"message": "No descriptions available to generate recommendations"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
