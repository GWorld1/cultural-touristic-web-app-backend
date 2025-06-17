const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

/**
 * Service for handling 360-degree panoramic images
 */
class PanoramaService {
  /**
   * Validate if uploaded image is suitable for 360-degree viewing
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  static validatePanoramicImage(file) {
    try {
      // Check file type
      if (!file.mimetype.startsWith('image/')) {
        return {
          isValid: false,
          error: 'File must be an image'
        };
      }

      // Check supported formats
      const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!supportedFormats.includes(file.mimetype)) {
        return {
          isValid: false,
          error: 'Supported formats: JPEG, JPG, PNG'
        };
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          isValid: false,
          error: 'File size must be less than 10MB'
        };
      }

      return {
        isValid: true,
        message: 'Image validation passed'
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate image'
      };
    }
  }

  /**
   * Upload and process panoramic image to Cloudinary
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} userId - User ID
   * @param {string} originalName - Original filename
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadPanoramicImage(fileBuffer, userId, originalName, options = {}) {
    try {
      // Create folder path: posts/userId
      const folderPath = `posts/${userId}`;
      
      // Generate public_id from original filename (without extension)
      const publicId = originalName.split('.')[0];
      const fullPublicId = `${folderPath}/${publicId}_${Date.now()}`;

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
            // Optimize for 360-degree viewing
            transformation: [
              {
                width: 2048,
                height: 1024,
                crop: 'limit',
                quality: 'auto:good'
              }
            ],
            ...options
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              // Validate aspect ratio for 360-degree images
              const aspectRatio = result.width / result.height;
              const isEquirectangular = Math.abs(aspectRatio - 2.0) < 0.1; // Allow 10% tolerance

              resolve({
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                aspectRatio: aspectRatio,
                isEquirectangular: isEquirectangular,
                resourceType: 'posts',
                userId: userId,
                // Generate different sizes for responsive viewing
                thumbnailUrl: cloudinary.url(result.public_id, {
                  width: 400,
                  height: 200,
                  crop: 'fill',
                  quality: 'auto:good',
                  format: 'jpg'
                }),
                mediumUrl: cloudinary.url(result.public_id, {
                  width: 800,
                  height: 400,
                  crop: 'fill',
                  quality: 'auto:good',
                  format: 'jpg'
                })
              });
            }
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Panorama upload error:', error);
      throw error;
    }
  }

  /**
   * Delete panoramic image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deletePanoramicImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Generate responsive image URLs for different screen sizes
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Object containing different image URLs
   */
  static generateResponsiveUrls(publicId) {
    return {
      thumbnail: cloudinary.url(publicId, {
        width: 400,
        height: 200,
        crop: 'fill',
        quality: 'auto:good',
        format: 'jpg'
      }),
      small: cloudinary.url(publicId, {
        width: 800,
        height: 400,
        crop: 'fill',
        quality: 'auto:good',
        format: 'jpg'
      }),
      medium: cloudinary.url(publicId, {
        width: 1600,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        format: 'jpg'
      }),
      large: cloudinary.url(publicId, {
        width: 2048,
        height: 1024,
        crop: 'limit',
        quality: 'auto:good',
        format: 'jpg'
      }),
      original: cloudinary.url(publicId, {
        quality: 'auto:good',
        format: 'jpg'
      })
    };
  }

  /**
   * Validate image dimensions for 360-degree viewing
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Object} Validation result
   */
  static validateDimensions(width, height) {
    const aspectRatio = width / height;
    const isEquirectangular = Math.abs(aspectRatio - 2.0) < 0.1;
    
    // Minimum resolution check
    const minWidth = 1024;
    const minHeight = 512;
    
    return {
      isValid: width >= minWidth && height >= minHeight && isEquirectangular,
      aspectRatio: aspectRatio,
      isEquirectangular: isEquirectangular,
      meetsMinimumResolution: width >= minWidth && height >= minHeight,
      recommendations: {
        idealAspectRatio: '2:1 (equirectangular)',
        minimumResolution: `${minWidth}x${minHeight}`,
        recommendedResolution: '2048x1024 or higher'
      }
    };
  }
}

module.exports = PanoramaService;
