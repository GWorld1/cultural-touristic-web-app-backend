const express = require('express');
const router = express.Router();
const {body,param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const commentController = require('../controllers/comment.controller');


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

// ==================== COMMENT ROUTES ====================

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:postId/comments', [
  authMiddleware.protect,
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  body('content').isString().notEmpty().isLength({ max: 1000 }).withMessage('Comment content is required and must be less than 1000 characters'),
  body('parentCommentId').optional().isString().withMessage('Parent comment ID must be a string'),
  handleValidationErrors
], commentController.addComment);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/:postId/comments', [
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('includeReplies').optional().isBoolean().withMessage('includeReplies must be a boolean'),
  handleValidationErrors
], commentController.getPostComments);

/**
 * @route   PUT /api/posts/:postId/comments/:commentId
 * @desc    Update a comment
 * @access  Private (owner only)
 */
router.put('/:postId/comments/:commentId', [
  authMiddleware.protect,
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  param('commentId').isString().notEmpty().withMessage('Comment ID is required'),
  body('content').isString().notEmpty().isLength({ max: 1000 }).withMessage('Comment content is required and must be less than 1000 characters'),
  handleValidationErrors
], commentController.updateComment);

/**
 * @route   DELETE /api/posts/:postId/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (owner only)
 */
router.delete('/:postId/comments/:commentId', [
  authMiddleware.protect,
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  param('commentId').isString().notEmpty().withMessage('Comment ID is required'),
  handleValidationErrors
], commentController.deleteComment);

/**
 * @route   GET /api/posts/:postId/comments/:commentId/replies
 * @desc    Get replies for a specific comment
 * @access  Public
 */
router.get('/:postId/comments/:commentId/replies', [
  param('postId').isString().notEmpty().withMessage('Post ID is required'),
  param('commentId').isString().notEmpty().withMessage('Comment ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  handleValidationErrors
], commentController.getCommentReplies);

module.exports = router;