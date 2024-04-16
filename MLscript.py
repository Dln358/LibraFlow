from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import mysql.connector
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import joblib

app = Flask(__name__)

# Load the SentenceTransformer model and NearestNeighbors model
model_st = SentenceTransformer('all-MiniLM-L6-v2')
model_knn = joblib.load('model_knn.pkl')

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

# Function to get books from database 
def get_books():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT BookID, Title, Description FROM Books")
    books = cursor.fetchall()
    cursor.close()
    conn.close()
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
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    liked_books = get_user_likes(user_id)
    books = get_books()
    all_books = {book[0]: (book[1], book[2]) for book in books}
    
    # Filter books and generate descriptions
    books_to_consider = {book_id: (title, desc) for book_id, (title, desc) in all_books.items() if book_id not in liked_books}
    descriptions = [desc for _, (_, desc) in books_to_consider.items()]
    
    # Generate embeddings for the descriptions
    if descriptions:
        book_embeddings = model_st.encode(descriptions, show_progress_bar=True)
        print("Embeddings shape:", book_embeddings.shape)
        # Find the closest books
        distances, indices = model_knn.kneighbors(book_embeddings, n_neighbors=min(5, len(descriptions)))
        print("Distances:", distances)
        print("Indices:", indices)
        recommendation_indices = np.unique(indices.flatten())
        print("Unique recommendation indices:", recommendation_indices)
        recommended_book_ids = [list(books_to_consider.keys())[i] for i in recommendation_indices if i < len(books_to_consider)]
        print("Recommended book IDs:", recommended_book_ids)
        recommended_titles = [all_books[book_id][0] for book_id in recommended_book_ids]
        return jsonify(recommended_titles)
    else:
        return jsonify({"message": "No new books to recommend"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
