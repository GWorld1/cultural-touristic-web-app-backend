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
 * POST /api/hotspots - Create a new hotspot with optional image upload
 */
router.post('/', [
  authMiddleware.protect,
  uploadSingle('image'),
  body('sceneId').isString().notEmpty(),
  body('tourId').isString().notEmpty(),
  body('title').isString().notEmpty().isLength({ max: 255 }),
  body('type').isIn(['info', 'link', 'image', 'video']),
  body('position.x').isFloat({ min: -1, max: 1 }),
  body('position.y').isFloat({ min: -1, max: 1 }),
  body('position.z').isFloat({ min: -1, max: 1 }),
  body('infoContent').optional().isObject(),
  body('linkUrl').optional().isURL(),
  body('style').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      sceneId, 
      tourId, 
      title, 
      type, 
      position, 
      infoContent, 
      linkUrl, 
      style 
    } = req.body;
    const userId = req.userId;
    let imageUrl = '';

    // Verify scene and tour ownership
    const scene = await databases.getDocument(DATABASE_ID, COLLECTIONS.SCENES, sceneId);
    if (scene.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only add hotspots to your own scenes'
      });
    }

    // Handle image upload if provided
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'hotspot',
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

    // Create hotspot
    const hotspot = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.HOTSPOTS,
      'unique()',
      {
        sceneId,
        tourId,
        title,
        type,
        position: JSON.stringify(position),
        infoContent: infoContent ? JSON.stringify(infoContent) : '',
        linkUrl: linkUrl || '',
        imageUrl: imageUrl,
        style: JSON.stringify(style || {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#cccccc',
          borderWidth: 1,
          borderRadius: 5,
          padding: 10
        }),
        authorId: userId
      }
    );

    res.status(201).json({
      success: true,
      data: { 
        hotspot: {
          ...hotspot,
          position: JSON.parse(hotspot.position),
          infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
          style: JSON.parse(hotspot.style)
        }
      }
    });
  } catch (error) {
    console.error('Error in POST /api/hotspots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/hotspots/:id - Get a single hotspot by ID
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const hotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
    
    res.json({
      success: true,
      data: { 
        hotspot: {
          ...hotspot,
          position: JSON.parse(hotspot.position),
          infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
          style: JSON.parse(hotspot.style)
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/hotspots/:id:', error);
    res.status(404).json({
      success: false,
      error: 'Hotspot not found'
    });
  }
});

/**
 * PUT /api/hotspots/:id - Update a hotspot
 */
router.put('/:id', [
  authMiddleware.protect,
  uploadSingle('image'),
  param('id').isString().notEmpty(),
  body('title').optional().isString().isLength({ max: 255 }),
  body('type').optional().isIn(['info', 'link', 'image', 'video']),
  body('position.x').optional().isFloat({ min: -1, max: 1 }),
  body('position.y').optional().isFloat({ min: -1, max: 1 }),
  body('position.z').optional().isFloat({ min: -1, max: 1 }),
  body('infoContent').optional().isObject(),
  body('linkUrl').optional().isURL(),
  body('style').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      type, 
      position, 
      infoContent, 
      linkUrl, 
      style 
    } = req.body;
    const userId = req.userId;

    // Verify hotspot ownership
    const existingHotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
    if (existingHotspot.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own hotspots'
      });
    }

    const updatePayload = {};
    if (title) updatePayload.title = title;
    if (type) updatePayload.type = type;
    if (position) updatePayload.position = JSON.stringify(position);
    if (infoContent) updatePayload.infoContent = JSON.stringify(infoContent);
    if (linkUrl !== undefined) updatePayload.linkUrl = linkUrl;
    if (style) updatePayload.style = JSON.stringify(style);

    // Handle image upload if provided
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadImage(
        req.file.buffer,
        'hotspot',
        userId,
        req.file.originalname
      );

      if (uploadResult.success) {
        updatePayload.imageUrl = uploadResult.url;
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image: ' + uploadResult.error
        });
      }
    }

    const hotspot = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.HOTSPOTS,
      id,
      updatePayload
    );

    res.json({
      success: true,
      data: { 
        hotspot: {
          ...hotspot,
          position: JSON.parse(hotspot.position),
          infoContent: hotspot.infoContent ? JSON.parse(hotspot.infoContent) : null,
          style: JSON.parse(hotspot.style)
        }
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/hotspots/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/hotspots/:id - Delete a hotspot
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify hotspot ownership
    const existingHotspot = await databases.getDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);
    if (existingHotspot.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only delete your own hotspots'
      });
    }

    // Delete the hotspot
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.HOTSPOTS, id);

    res.json({
      success: true,
      data: { message: 'Hotspot deleted successfully' }
    });
  } catch (error) {
    console.error('Error in DELETE /api/hotspots/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;
