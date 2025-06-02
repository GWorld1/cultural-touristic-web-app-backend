// server.js
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


// Initialize Express app
const app = express();




app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Import routes
const authRouter = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const imageRoutes = require('./routes/image.routes');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes); // Your image routes are correctly mounted here

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Cultural Touristic Web Application API' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  });
});



const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});