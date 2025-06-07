const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const  authMiddleware  = require('../middleware/auth');



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


const TourService = require('../services/tours');

router.get("/api/tours", [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('isPublic').optional().isBoolean(),
  query('tags').optional().isArray(),
  handleValidationErrors
] ,async (req, res) => {
 try {
    const { page = 1, limit = 10, category, search, isPublic, tags, authorId } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
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
    console.error('Error in GET /api/tours:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/tours/:id - Get a single tour by ID
 */
router.get('/api/tours/:id', [
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
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
    console.error('Error in GET /api/tours/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/tours - Create a new tour
 */
router.post('/api/tours', [
  authMiddleware.protect,
  body('title').isString().notEmpty().isLength({ max: 255 }),
  body('description').isString().notEmpty().isLength({ max: 2000 }),
  body('metadata.author').isString().notEmpty(),
  body('metadata.estimatedDuration').optional().isInt({ min: 1 }),
  body('metadata.isPublic').optional().isBoolean(),
  body('metadata.tags').optional().isArray(),
  handleValidationErrors
], async (req, res) => {
  try {
    const tourData = req.body;
    const userId = req.userId;
    
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
    console.error('Error in POST /api/tours:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/tours/:id - Update a tour
 */
router.put('/api/tours/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  body('title').optional().isString().isLength({ max: 255 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.userId;
    
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
    console.error('Error in PUT /api/tours/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/tours/:id - Delete a tour
 */
router.delete('/api/tours/:id', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
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
    console.error('Error in DELETE /api/tours/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/tours/:id/publish - Publish a tour
 */
router.put('/api/tours/:id/publish', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
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
    console.error('Error in PUT /api/tours/:id/publish:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/tours/:id/unpublish - Unpublish a tour
 */
router.put('/api/tours/:id/unpublish', [
  authMiddleware.protect,
  param('id').isString().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
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
    console.error('Error in PUT /api/tours/:id/unpublish:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


module.exports = router;