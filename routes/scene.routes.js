const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const CloudinaryService = require('../services/cloudinary.service');
const { databases, databaseId: DATABASE_ID } = require('../config/appwrite');
const { Query } = require('node-appwrite');

const COLLECTIONS = {
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8'
};

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
 * POST /api/scenes - Create a new scene with optional image upload
 */
router.post('/', [
  authMiddleware.protect,
  uploadSingle('image'),
  body('tourId').isString().notEmpty(),
  body('title').isString().notEmpty().isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('order').optional().isInt({ min: 0 }),
  body('panoramaUrl').optional().isURL(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { tourId, title, description, order, panoramaUrl } = req.body;
    const userId = req.userId;
    let imageUrl = panoramaUrl;

    // Verify tour ownership
    const tour = await databases.getDocument(DATABASE_ID, COLLECTIONS.TOURS, tourId);
    if (tour.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only add scenes to your own tours'
      });
    }

    // Handle image upload if provided
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'scene',
        userId,
        req.file.originalname
      );

      if (uploadResult.success) {
        imageUrl = uploadResult.url;
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image: ' + uploadResult.error
        });
      }
    }

    // Create scene
    const scene = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SCENES,
      'unique()',
      {
        tourId,
        title,
        description: description || '',
        order: order || 0,
        panoramaUrl: imageUrl || '',
        authorId: userId
      }
    );

    res.status(201).json({
      success: true,
      data: { scene }
    });
  } catch (error) {
    console.error('Error in POST /api/scenes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/scenes/:id - Get a single scene by ID
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const scene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
    
    res.json({
      success: true,
      data: { scene }
    });
  } catch (error) {
    console.error('Error in GET /api/scenes/:id:', error);
    res.status(404).json({
      success: false,
      error: 'Scene not found'
    });
  }
});

/**
 * PUT /api/scenes/:id - Update a scene
 */
router.put('/:id', [
  authMiddleware.protect,
  uploadSingle('image'),
  param('id').isString().notEmpty(),
  body('title').optional().isString().isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('order').optional().isInt({ min: 0 }),
  body('panoramaUrl').optional().isURL(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, panoramaUrl } = req.body;
    const userId = req.userId;

    // Verify scene ownership
    const existingScene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
    if (existingScene.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own scenes'
      });
    }

    const updatePayload = {};
    if (title) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (order !== undefined) updatePayload.order = order;
    if (panoramaUrl) updatePayload.panoramaUrl = panoramaUrl;

    // Handle image upload if provided
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'scene',
        userId,
        req.file.originalname
      );

      if (uploadResult.success) {
        updatePayload.panoramaUrl = uploadResult.url;
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image: ' + uploadResult.error
        });
      }
    }

    const scene = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SCENES,
      id,
      updatePayload
    );

    res.json({
      success: true,
      data: { scene }
    });
  } catch (error) {
    console.error('Error in PUT /api/scenes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/scenes/:id - Delete a scene
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify scene ownership
    const existingScene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, id);
    if (existingScene.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only delete your own scenes'
      });
    }

    // Delete associated hotspots first
    const hotspots = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HOTSPOTS,
      [Query.equal('sceneId', id)]
    );

    await Promise.all(
      hotspots.documents.map(hotspot =>
        databases.deleteDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, hotspot.$id)
      )
    );

    // Delete the scene
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SCENES, id);

    res.json({
      success: true,
      data: { message: 'Scene deleted successfully' }
    });
  } catch (error) {
    console.error('Error in DELETE /api/scenes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;
