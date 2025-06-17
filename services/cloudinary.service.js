const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

class CloudinaryService {
  /**
   * Upload image to Cloudinary with organized folder structure
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} resourceType - Type of resource (tour, scene, hotspot)
   * @param {string} userId - User ID who uploaded the image
   * @param {string} originalName - Original filename
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadImage(fileBuffer, resourceType, userId, originalName, options = {}) {
    try {
      // Create folder path: resourceType/userId
      const folderPath = `${resourceType}/${userId}`;
      
      // Generate public_id from original filename (without extension)
      const publicId = originalName.split('.')[0];
      const fullPublicId = `${folderPath}/${publicId}`;

      // Convert buffer to stream
      const stream = Readable.from(fileBuffer);

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: fullPublicId,
            folder: folderPath,
            resource_type: 'image',
            format: 'jpg', // Convert all images to JPG for consistency
            quality: 'auto:good',
            fetch_format: 'auto',
            ...options
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                resourceType: resourceType,
                userId: userId
              });
            }
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of the image to delete
   * @returns {Promise<Object>} Delete result
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        return {
          success: true,
          message: 'Image deleted successfully'
        };
      } else {
        return {
          success: false,
          error: 'Failed to delete image'
        };
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get images by folder (resource type and user)
   * @param {string} resourceType - Type of resource (tour, scene, hotspot)
   * @param {string} userId - User ID
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Object>} List of images
   */
  static async getImagesByFolder(resourceType, userId, maxResults = 50) {
    try {
      const folderPath = `${resourceType}/${userId}`;
      
      const result = await cloudinary.search
        .expression(`folder:${folderPath}`)
        .sort_by([['created_at', 'desc']])
        .max_results(maxResults)
        .execute();

      return {
        success: true,
        images: result.resources.map(resource => ({
          publicId: resource.public_id,
          url: resource.secure_url,
          format: resource.format,
          width: resource.width,
          height: resource.height,
          bytes: resource.bytes,
          createdAt: resource.created_at
        })),
        total: result.total_count
      };
    } catch (error) {
      console.error('Error getting images by folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate transformation URL for image optimization
   * @param {string} publicId - Public ID of the image
   * @param {Object} transformations - Transformation options
   * @returns {string} Transformed image URL
   */
  static generateTransformationUrl(publicId, transformations = {}) {
    try {
      return cloudinary.url(publicId, {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        ...transformations
      });
    } catch (error) {
      console.error('Error generating transformation URL:', error);
      return null;
    }
  }

  /**
   * Get image details by public ID
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<Object>} Image details
   */
  static async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        image: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          createdAt: result.created_at
        }
      };
    } catch (error) {
      console.error('Error getting image details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CloudinaryService;
