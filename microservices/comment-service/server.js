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
const commentRoutes = require('./src/routes/comment.routes');

// Use route
app.use('/api/posts', commentRoutes);


// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'comment-service' });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.COMMENT_SERVICE_PORT || 3004;
app.listen(PORT, () => {
    console.log(`comment service running on port ${PORT}`);
});

module.exports = app;