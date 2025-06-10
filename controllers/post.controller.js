const PostService = require('../services/post.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const postController = {
  /**
   * Create a new post with 360-degree panoramic image
   */
  async createPost(req, res) {
    try {
      const { caption, location, tags, isPublic } = req.body;
      const userId = req.user.$id;

      // Validate input
      if (!caption || caption.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Caption is required' 
        });
      }

      if (caption.length > 2000) {
        return res.status(400).json({ 
          success: false,
          error: 'Caption must be less than 2000 characters' 
        });
      }

      // Check if image file is provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Panoramic image is required'
        });
      }

      //Parse tags and location of provided
      let parseLocation = null;
      let parseTags = [];
      let parseIsPublic = isPublic === 'true' ? true : false;

      if (location) {
        try {
          parseLocation = typeof location === 'string' ? JSON.parse(location) : location;
        } catch (error) {
          console.error('Invalid location data:', error);
          parseLocation = null;
        }
      }

      if (tags) {
        try {
          parseTags = Array.isArray(tags) ? tags : JSON.parse(tags);
          parseTags = parseTags.slice(0, 10).filter(tag => 
            typeof tag === 'string' && tag.length > 0 && tag.length <= 50
          );
        } catch (error) {
          console.error('Invalid tags data:', error);
          parseTags = [];
        }
      }

      

      // Create post using service
      const result = await PostService.createPost(
        { caption, location: parseLocation, tags: parseTags, isPublic: parseIsPublic },
        userId,
        req.file
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Post created successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create post', 
        details: error.message 
      });
    }
  },

  /**
   * Get posts feed with pagination
   */
  async getPostsFeed(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 posts per page
      const targetUserId = req.query.userId || null;
      const currentUserId = req.user?.$id || null;

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

      // Get posts using service
      const result = await PostService.getPostsFeed(page, limit, currentUserId, targetUserId);

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
      console.error('Get posts feed error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch posts', 
        details: error.message 
      });
    }
  },

  /**
   * Get single post by ID
   */
  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.$id || null;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Get post using service
      const result = await PostService.getPostById(id, userId);

      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        const statusCode = result.error.includes('not found') || result.error.includes('not accessible') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Get post by ID error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch post', 
        details: error.message 
      });
    }
  },

  /**
   * Update post
   */
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { caption, location, tags, isPublic } = req.body;
      const userId = req.user.$id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Validate caption if provided
      if (caption !== undefined) {
        if (typeof caption !== 'string' || caption.trim().length === 0) {
          return res.status(400).json({ 
            success: false,
            error: 'Caption must be a non-empty string' 
          });
        }

        if (caption.length > 2000) {
          return res.status(400).json({ 
            success: false,
            error: 'Caption must be less than 2000 characters' 
          });
        }
      }

      // Update post using service
      const result = await PostService.updatePost(id, { caption, location, tags, isPublic }, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Post updated successfully',
          data: result.data
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
      console.error('Update post error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update post', 
        details: error.message 
      });
    }
  },

  /**
   * Delete post
   */
  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      // Delete post using service
      const result = await PostService.deletePost(id, userId);

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
      console.error('Delete post error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete post', 
        details: error.message 
      });
    }
  },

  /**
   * Get posts by specific user
   */
  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const currentUserId = req.user?.$id || null;

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

      // Get user posts using service
      const result = await PostService.getPostsFeed(page, limit, currentUserId, userId);

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
      console.error('Get user posts error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user posts', 
        details: error.message 
      });
    }
  }
};

module.exports = postController;
