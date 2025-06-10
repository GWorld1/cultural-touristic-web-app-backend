const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const postController = require('../controllers/post.controller');
const likeController = require('../controllers/like.controller');
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
  body('location').optional().isJSON().withMessage('Location must be valid JSON'),
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

// Error handling middleware for upload errors
router.use(handleUploadError);

module.exports = router;
