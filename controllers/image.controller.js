const { cloudinary } = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Upload single image to Cloudinary
 * @route   POST /api/images/uploadImage
 * @access  Public
 */
const uploadSingleImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No image file provided.',
        });
    }

    const imageData = {
        public_id: req.file.filename,
        secure_url: req.file.path,
        original_filename: req.file.originalname,
        format: req.file.mimetype.split('/')[1],
        bytes: req.file.size,
        width: req.file.width || null,
        height: req.file.height || null,
        title: req.body.title || 'Untitled Image',
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
    };

    res.status(201).json({
        success: true,
        message: 'Image uploaded to Cloudinary successfully!',
        data: imageData,
    });
});

/**
 * @desc    Upload multiple images to Cloudinary
 * @route   POST /api/images/upload-multiple
 * @access  Public
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No image files provided.',
        });
    }

    const uploadedImages = req.files.map(file => ({
        public_id: file.filename,
        secure_url: file.path,
        original_filename: file.originalname,
        format: file.mimetype.split('/')[1],
        bytes: file.size,
        width: file.width || null,
        height: file.height || null,
        title: req.body.title || 'Untitled Image',
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
    }));

    res.status(201).json({
        success: true,
        message: `${uploadedImages.length} images uploaded to Cloudinary!`,
        data: uploadedImages,
    });
});

/**
 * @desc    Get all images from Cloudinary
 * @route   GET /api/images/all
 * @access  Public
 */
const getAllImages = asyncHandler(async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500, // Cloudinary's max is 500 per request
            // Add pagination if needed with next_cursor
        });

        res.status(200).json({
            success: true,
            data: result.resources,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch images from Cloudinary',
            error: error.message,
        });
    }
});

/**
 * @desc    Get image by public_id from Cloudinary
 * @route   GET /api/images/:public_id
 * @access  Public
 */
const getImageByPublicId = asyncHandler(async (req, res) => {
    try {
        const result = await cloudinary.api.resource(req.params.public_id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error.http_code === 404) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in Cloudinary',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch image from Cloudinary',
            error: error.message,
        });
    }
});

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/images/:public_id
 * @access  Public
 */
const deleteImage = asyncHandler(async (req, res) => {
    try {
        const result = await cloudinary.uploader.destroy(req.params.public_id);
        
        if (result.result === 'not found') {
            return res.status(404).json({
                success: false,
                message: 'Image not found in Cloudinary',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image deleted from Cloudinary!',
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete image from Cloudinary',
            error: error.message,
        });
    }
});

/**
 * @desc    Update image metadata in Cloudinary
 * @route   PUT /api/images/:public_id
 * @access  Public
 */
const updateImageDetails = asyncHandler(async (req, res) => {
    const { title, description, tags } = req.body;

    try {
        // Update context (metadata) in Cloudinary
        const result = await cloudinary.uploader.explicit(req.params.public_id, {
            type: 'upload',
            context: {
                caption: description || '',
                alt: title || 'Untitled Image',
            },
            tags: tags ? tags.split(',') : [],
        });

        res.status(200).json({
            success: true,
            message: 'Image metadata updated in Cloudinary!',
            data: result,
        });
    } catch (error) {
        if (error.http_code === 404) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in Cloudinary',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update image in Cloudinary',
            error: error.message,
        });
    }
});

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    getAllImages,
    getImageByPublicId,
    deleteImage,
    updateImageDetails,
};