const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { collectMetric, metricEndpoint } = require('./src/config/prometheus');
// Load environment variables
dotenv.config();


// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(collectMetric); // Collect metrics for all routes
// Import route
const commentRoutes = require('./src/routes/comment.routes');

// Use route
app.use('/api/posts', commentRoutes);


// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'comment-service' });
});

app.get('/metrics', metricEndpoint); // Metrics endpoint


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