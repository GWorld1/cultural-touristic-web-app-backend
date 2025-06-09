const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const tourController = require('../controllers/tour.controller');



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




router.get("/", [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('isPublic').optional().isBoolean(),
  handleValidationErrors
], tourController.getTours);

/**
 *@route GET /api/tours/:id - Get a single tour by ID
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], tourController.getTourById);

/**
 * POST /api/tours/test - Create a new tour (JSON only, for testing)
 */
router.post('/test', [
  authMiddleware.protect,
  body('title').isString().notEmpty().isLength({ max: 255 }),
  body('description').isString().notEmpty().isLength({ max: 2000 }),
  body('metadata.author').isString().notEmpty(),
  body('metadata.estimatedDuration').optional().isInt({ min: 1 }),
  body('metadata.isPublic').optional().isBoolean(),
  body('metadata.tags').optional().isArray(),
  handleValidationErrors
], tourController.createTourTest);

/**
 * POST /api/tours - Create a new tour
 */
router.post('/', [
  authMiddleware.protect,
  uploadSingle('thumbnail'),
  body('title').isString().notEmpty().isLength({ max: 255 }),
  body('description').isString().notEmpty().isLength({ max: 2000 }),
  body('author').isString().notEmpty(),
  body('estimatedDuration').optional(),
  body('isPublic').optional().isBoolean(),
  handleValidationErrors
], tourController.createTour);

/**
 * PUT /api/tours/:id - Update a tour
 */
router.put('/:id', [
  authMiddleware.protect,
  uploadSingle('thumbnail'),
  param('id').isString().notEmpty(),
  body('title').optional().isString().isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  handleValidationErrors
], tourController.updateTour);

/**
 * DELETE /api/tours/:id - Delete a tour
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], tourController.deleteTour);

/**
 * PUT /api/tours/:id/publish - Publish a tour
 */
router.put('/:id/publish', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], tourController.publishTour);

/**
 * PUT /api/tours/:id/unpublish - Unpublish a tour
 */
router.put('/:id/unpublish', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], tourController.unpublishTour);

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;