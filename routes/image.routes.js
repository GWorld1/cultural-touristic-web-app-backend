const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const { upload } = require('../config/cloudinary');

// Upload routes
router.post('/uploadImage', upload.single('image'), imageController.uploadSingleImage);
router.post('/upload-multiple', upload.array('images', 5), imageController.uploadMultipleImages);

// Image management routes
router.get('/all', imageController.getAllImages);
router.get('/:public_id', imageController.getImageByPublicId);
router.delete('/:public_id', imageController.deleteImage);
router.put('/:public_id', imageController.updateImageDetails);

module.exports = router;