const express = require('express');
const router = express.Router();
const {param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const likeController = require('../controllers/like.controller');


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

// ==================== LIKE ROUTES ====================

/**
 * @route   POST /api/posts/:postId/likes
 * @desc    Toggle like on a post (like/unlike)
 * @access  Private
 */
router.post('/:postId/likes', [
  authMiddleware.protect,
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  handleValidationErrors
], likeController.toggleLike);

/**
 * @route   GET /api/posts/:postId/likes/check
 * @desc    Check if current user has liked the post
 * @access  Public (optional authentication)
 */
router.get('/:postId/likes/check', [
  authMiddleware.optional,
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  handleValidationErrors
], likeController.checkUserLike);

/**
 * @route   GET /api/posts/:postId/likes
 * @desc    Get users who liked the post
 * @access  Public
 */
router.get('/:postId/likes', [
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], likeController.getPostLikes);

/**
 * @route   GET /api/posts/:postId/likes/stats
 * @desc    Get like statistics for a post
 * @access  Public
 */
router.get('/:postId/likes/stats', [
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  handleValidationErrors
], likeController.getLikeStats);

// ==================== USER LIKES ROUTES ====================

/**
 * @route   GET /api/posts/users/:userId/likes
 * @desc    Get posts liked by a specific user
 * @access  Public
 */
router.get('/users/:userId/likes', [
  param('userId').isString().notEmpty().withMessage('User ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], likeController.getUserLikes);


module.exports = router;