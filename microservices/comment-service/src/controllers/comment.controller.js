const CommentService = require('../services/comment.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const commentController = {
  /**
   * Add a comment to a post
   */
  async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user.$id;

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be less than 1000 characters'
        });
      }

      // Add comment using service
      const result = await CommentService.addComment(postId, userId, content, parentCommentId);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Comment added successfully',
          data: result.data
        });
      } else {
        const statusCode = result.error.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to add comment', 
        details: error.message 
      });
    }
  },

  /**
   * Get comments for a post
   */
  async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 comments per page
      const includeReplies = req.query.includeReplies === 'true';

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Validate pagination parameters
      if (page < 1) {
        return res.status(400).json({
          success: false,
          error: 'Page number must be greater than 0'
        });
      }

      if (limit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be greater than 0'
        });
      }

      // Get comments using service
      const result = await CommentService.getPostComments(postId, page, limit, includeReplies);

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Get post comments error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch comments', 
        details: error.message 
      });
    }
  },

  /**
   * Update a comment
   */
  async updateComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.$id;

      if (!postId || !commentId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID and Comment ID are required'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be less than 1000 characters'
        });
      }

      // Update comment using service
      const result = await CommentService.updateComment(commentId, userId, content);

      if (result.success) {
        res.json({
          success: true,
          message: 'Comment updated successfully',
          data: result.data
        });
      } else {
        const statusCode = result.error.includes('Unauthorized') ? 403 : 
                          result.error.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update comment', 
        details: error.message 
      });
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const userId = req.user.$id;

      if (!postId || !commentId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID and Comment ID are required'
        });
      }

      // Delete comment using service
      const result = await CommentService.deleteComment(commentId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error.includes('Unauthorized') ? 403 : 
                          result.error.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete comment', 
        details: error.message 
      });
    }
  },

  /**
   * Get replies for a specific comment
   */
  async getCommentReplies(req, res) {
    try {
      const { postId, commentId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Max 20 replies per page

      if (!postId || !commentId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID and Comment ID are required'
        });
      }

      // Validate pagination parameters
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      // Get replies using service
      const result = await CommentService.getCommentReplies(commentId, page, limit);

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Get comment replies error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch replies', 
        details: error.message 
      });
    }
  }
};

module.exports = commentController;
