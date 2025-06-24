const { collectMetric, metricEndpoint } = require('./src/config/prometheus');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(collectMetric); // Collect metrics for all routes

// Import routes
const authRouter = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');


// Use routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'auth-service' });
});

app.get('/metrics', metricEndpoint); // Metrics endpoint

// Route handlers will be imported here
// app.use('/api/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});

module.exports = server;
