// config/cloudinary.js - Fixed version
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: Check if environment variables are loaded
console.log('Cloudinary config check:');
console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('- API key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

// Test Cloudinary connection
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
  }
};
testConnection();

// Simplified Cloudinary Storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // Remove transformations for now to test basic upload
    public_id: (req, file) => {
      // Generate a unique public_id
      return 'upload_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    },
  },
});

// Configure multer middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload,
};