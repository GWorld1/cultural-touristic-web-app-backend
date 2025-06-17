const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const postController = require('../controllers/post.controller');


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
 * @route   POST /api/posts
 * @desc    Create a new post with 360-degree panoramic image
 * @access  Private
 */
router.post('/', [
  authMiddleware.protect,
  uploadSingle('image'),
  body('caption').isString().notEmpty().isLength({ max: 2000 }).withMessage('Caption is required and must be less than 2000 characters'),
  body('location').optional().isString().withMessage('Location must be valid JSON'),
  body('tags').optional().isString().withMessage('Tags must be an array with maximum 10 items'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  handleValidationErrors
], postController.createPost);

/**
 * @route   GET /api/posts
 * @desc    Get posts feed with pagination
 * @access  Public (optional authentication)
 */
router.get('/', [
  authMiddleware.optional,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('userId').optional().isString().withMessage('User ID must be a string'),
  handleValidationErrors
], postController.getPostsFeed);

/**
 * @route   GET /api/posts/search
 * @desc    Search posts by tags and location
 * @access  Public (optional authentication)
 */
router.get('/search', [
  authMiddleware.optional,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('tags').optional().isString().withMessage('Tags must be a comma-separated string or JSON array'),
  query('location').optional().isString().withMessage('Location must be a string'),
  query('city').optional().isString().withMessage('City must be a string'),
  query('country').optional().isString().withMessage('Country must be a string'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'popular']).withMessage('Sort by must be newest, oldest, or popular'),
  handleValidationErrors
], postController.searchPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Public (optional authentication)
 */
router.get('/:id', [
  authMiddleware.optional,
  param('id').isString().notEmpty().withMessage('Post ID is required'),
  handleValidationErrors
], postController.getPostById);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update post
 * @access  Private (owner only)
 */
router.put('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty().withMessage('Post ID is required'),
  body('caption').optional().isString().isLength({ max: 2000 }).withMessage('Caption must be less than 2000 characters'),
  body('location').optional().isObject().withMessage('Location must be valid JSON'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array with maximum 10 items'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  handleValidationErrors
], postController.updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post
 * @access  Private (owner only)
 */
router.delete('/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty().withMessage('Post ID is required'),
  handleValidationErrors
], postController.deletePost);

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by specific user
 * @access  Public (optional authentication)
 */
router.get('/user/:userId', [
  authMiddleware.optional,
  param('userId').isString().notEmpty().withMessage('User ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], postController.getUserPosts);

module.exports = router;