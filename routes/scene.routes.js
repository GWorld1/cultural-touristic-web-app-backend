const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const sceneController = require('../controllers/scene.controller');



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
  body('order').optional(),
  body('panoramaUrl').optional(),
  body('pitch').optional(),
  body('yaw').optional(),
  body('hfov').optional(),
  handleValidationErrors
], sceneController.createScene);

/**
 * GET /api/scenes/:id - Get a single scene by ID
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], sceneController.getSceneById);

/**
 * PUT /api/scenes/:id - Update a scene
 */
router.put('/:id', [
  authMiddleware.protect,
  uploadSingle('image'),
  param('id').isString().notEmpty(),
  body('title').optional().isString().isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('order').optional(),
  body('panoramaUrl').optional(),
  body('pitch').optional(),
  body('yaw').optional(),
  body('hfov').optional(),
  handleValidationErrors
], sceneController.updateScene);

/**
 * DELETE /api/scenes/:id - Delete a scene
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], sceneController.deleteScene);

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;
