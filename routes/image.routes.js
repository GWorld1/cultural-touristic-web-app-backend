const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const CloudinaryService = require('../services/cloudinary.service');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/images/upload - Upload image to Cloudinary
 */
router.post('/upload', [
  authMiddleware.protect,
  uploadSingle('image'),
  body('resourceType').isIn(['tour', 'scene', 'hotspot']).withMessage('Resource type must be tour, scene, or hotspot'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { resourceType } = req.body;
    const userId = req.userId;
    const file = req.file;

    const result = await CloudinaryService.uploadImage(
      file.buffer,
      resourceType,
      userId,
      file.originalname
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in POST /api/images/upload:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/images - List images by resource type and user
 */
router.get('/', [
  authMiddleware.protect,
  query('resourceType').optional().isIn(['tour', 'scene', 'hotspot']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { resourceType, limit = 50 } = req.query;
    const userId = req.userId;

    if (resourceType) {
      // Get images for specific resource type
      const result = await CloudinaryService.getImagesByFolder(resourceType, userId, parseInt(limit));

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } else {
      // Get images for all resource types
      const tourImages = await CloudinaryService.getImagesByFolder('tour', userId, parseInt(limit));
      const sceneImages = await CloudinaryService.getImagesByFolder('scene', userId, parseInt(limit));
      const hotspotImages = await CloudinaryService.getImagesByFolder('hotspot', userId, parseInt(limit));

      res.json({
        success: true,
        data: {
          tour: tourImages.success ? tourImages : { images: [], total: 0 },
          scene: sceneImages.success ? sceneImages : { images: [], total: 0 },
          hotspot: hotspotImages.success ? hotspotImages : { images: [], total: 0 }
        }
      });
    }
  } catch (error) {
    console.error('Error in GET /api/images:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/images/:publicId - Get image details
 */
router.get('/:publicId', [
  authMiddleware.protect,
  param('publicId').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await CloudinaryService.getImageDetails(publicId);

    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /api/images/:publicId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/images/:publicId - Delete image
 */
router.delete('/:publicId', [
  authMiddleware.protect,
  param('publicId').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await CloudinaryService.deleteImage(publicId);

    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/images/:publicId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;