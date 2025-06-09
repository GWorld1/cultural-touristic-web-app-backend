const TourService = require('../services/tours');
const CloudinaryService = require('../services/cloudinary.service');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const tourController = {

  // Get all tours with filtering and pagination
  async getTours(req, res) {
    try {
      const { page = 1, limit = 10, category, search, isPublic, tags, authorId } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (search) filters.search = search;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      
      // Parse tags if it's a string (from query)
      if (tags && typeof tags === 'string') {
        try {
          filters.tags = JSON.parse(tags);
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          filters.tags = tags.split(',').map(tag => tag.trim());
        }
      }
      
      if (authorId) filters.authorId = authorId;
      
      const pagination = {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const result = await TourService.getTours(filters, pagination);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            tours: result.tours,
            total: result.total,
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: result.tours.length === parseInt(limit)
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getTours:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get a single tour by ID
  async getTourById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await TourService.getTourById(id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getTourById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Create a new tour (test version - JSON only)
  async createTourTest(req, res) {
    try {
      const tourData = req.body;
      const userId = req.user.$id;

      const result = await TourService.createTour(tourData, userId);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in createTourTest:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Create a new tour with file upload
  async createTour(req, res) {
    try {
      const tourData = req.body;
      const userId = req.user.$id;
      let thumbnailUrl = '';

      // Parse form data fields
      // Parse tags if it's a string (from form-data)
      if (tourData.tags && typeof tourData.tags === 'string') {
        try {
          tourData.tags = JSON.parse(tourData.tags);
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          tourData.tags = tourData.tags.split(',').map(tag => tag.trim());
        }
      }

      // Ensure tags is an array
      if (!Array.isArray(tourData.tags)) {
        tourData.tags = [];
      }

      // Parse isPublic boolean
      if (tourData.isPublic && typeof tourData.isPublic === 'string') {
        tourData.isPublic = tourData.isPublic.toLowerCase() === 'true';
      }

      // Parse estimatedDuration
      if (tourData.estimatedDuration && typeof tourData.estimatedDuration === 'string') {
        tourData.estimatedDuration = parseInt(tourData.estimatedDuration);
      }

      // Handle thumbnail upload if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'tour',
          userId,
          req.file.originalname
        );

        if (uploadResult.success) {
          thumbnailUrl = uploadResult.url;
          // Add thumbnail URL to tour metadata
          if (!tourData.metadata) tourData.metadata = {};
          tourData.metadata.thumbnailUrl = thumbnailUrl;
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload thumbnail: ' + uploadResult.error
          });
        }
      }

      const result = await TourService.createTour(tourData, userId);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in createTour:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Update a tour
  async updateTour(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.$id;

      // Parse tags if it's a string
      if (updateData.tags && typeof updateData.tags === 'string') {
        try {
          updateData.tags = JSON.parse(updateData.tags);
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
        }
      }

      // Handle thumbnail upload if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'tour',
          userId,
          req.file.originalname
        );

        if (uploadResult.success) {
          // Add thumbnail URL to update data
          updateData.thumbnailUrl = uploadResult.url;
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload thumbnail: ' + uploadResult.error
          });
        }
      }

      const result = await TourService.updateTour(id, updateData, userId);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in updateTour:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Delete a tour
  async deleteTour(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      const result = await TourService.deleteTour(id, userId);

      if (result.success) {
        res.json({
          success: true,
          data: { success: true }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in deleteTour:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Publish a tour
  async publishTour(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      const result = await TourService.toggleTourPublish(id, true, userId);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in publishTour:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Unpublish a tour
  async unpublishTour(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.$id;

      const result = await TourService.toggleTourPublish(id, false, userId);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in unpublishTour:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

};

module.exports = tourController;
