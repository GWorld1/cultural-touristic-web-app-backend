const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();


// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import route
const postRoutes = require('./src/routes/post.routes');

// Use route
app.use('/api/posts', postRoutes);


// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'post-service' });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.POST_SERVICE_PORT || 3002;
app.listen(PORT, () => {
    console.log(`Post service running on port ${PORT}`);
});

module.exports = app;