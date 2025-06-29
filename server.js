const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const authRouter = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const imageRoutes = require('./routes/image.routes');
const tourRoutes = require('./routes/tour.routes');
const sceneRoutes = require('./routes/scene.routes');
const hotspotRoutes = require('./routes/hotspot.routes');
const postRoutes = require('./routes/post.routes');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/posts', postRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Cultural Touristic Web Application API' });
  
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});