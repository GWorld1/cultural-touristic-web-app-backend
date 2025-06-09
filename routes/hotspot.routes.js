const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const {uploadSingle, handleUploadError } = require('../middleware/upload');
const hotspotController = require('../controllers/hotspot.controller');



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
  body('text').isString().notEmpty().isLength({ max: 255 }),
  body('type').isIn(['info', 'link']),
  body('pitch').optional(),
  body('yaw').optional(),
  body('infoContent').optional(),
  body('externalUrl').optional().isURL(),
  body('style').optional(),
  handleValidationErrors
], hotspotController.createHotspot);

/**
 * GET /api/hotspots/:id - Get a single hotspot by ID
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], hotspotController.getHotspotById);

/**
 * PUT /api/hotspots/:id - Update a hotspot
 */
router.put('/:id', [
  authMiddleware.protect,
  uploadSingle('image'),
  param('id').isString().notEmpty(),
  body('text').optional().isString().isLength({ max: 255 }),
  body('type').optional().isIn(['info', 'link']),
  body('pitch').optional(),
  body('yaw').optional(),
  body('infoContent').optional(),
  body('externalUrl').optional(),
  body('style').optional(),
  handleValidationErrors
], hotspotController.updateHotspot);

/**
 * DELETE /api/hotspots/:id - Delete a hotspot
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], hotspotController.deleteHotspot);

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;
