const axios = require('axios');

// function to call flask service
function getRecommendations(userId) {
    const url = `http://localhost:5000/recommend`;
    return axios.post(url, { user_id: userId })
        .then(response => response.data)
        .catch(error => {
            console.error('Error fetching recommendations:', error);
            return [];  // Return an empty array if no recommendations
        });
}

module.exports = { getRecommendations };

