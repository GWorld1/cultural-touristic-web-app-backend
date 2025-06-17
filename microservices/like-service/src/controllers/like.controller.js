const LikeService = require('../services/like.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const likeController = {
  /**
   * Toggle like on a post (like/unlike)
   */
  async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.$id;

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Toggle like using service
      const result = await LikeService.toggleLike(postId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.data.isLiked ? 'Post liked successfully' : 'Post unliked successfully',
          data: result.data
        });
      } else {
        const statusCode = result.error.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to toggle like', 
        details: error.message 
      });
    }
  },

  /**
   * Check if current user has liked a post
   */
  async checkUserLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user?.$id;

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      if (!userId) {
        // If user is not authenticated, they haven't liked the post
        return res.json({
          success: true,
          data: {
            isLiked: false,
            postId: postId,
            userId: null
          }
        });
      }

      // Check like status using service
      const result = await LikeService.checkUserLike(postId, userId);

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
      console.error('Check user like error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to check like status', 
        details: error.message 
      });
    }
  },

  /**
   * Get users who liked a specific post
   */
  async getPostLikes(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 likes per page

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

      // Get post likes using service
      const result = await LikeService.getPostLikes(postId, page, limit);

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
      console.error('Get post likes error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch post likes', 
        details: error.message 
      });
    }
  },

  /**
   * Get posts liked by a specific user
   */
  async getUserLikes(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 posts per page
      const currentUserId = req.user?.$id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Validate pagination parameters
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters'
        });
      }

      // Get user likes using service
      const result = await LikeService.getUserLikes(userId, page, limit);

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
      console.error('Get user likes error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user likes', 
        details: error.message 
      });
    }
  },

  /**
   * Get like statistics for a post
   */
  async getLikeStats(req, res) {
    try {
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Get like statistics using service
      const result = await LikeService.getLikeStats(postId);

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
      console.error('Get like stats error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch like statistics', 
        details: error.message 
      });
    }
  }
};

module.exports = likeController;
