const { Query } = require('node-appwrite');
const { databases, databaseId: DATABASE_ID, postsCollectionId, usersCollectionId } = require('../config/appwrite');
const PanoramaService = require('./panorama.service');

/**
 * Post Service Functions
 */
class PostService {
  /**
   * Create a new post with 360-degree image
   * @param {Object} postData - Post data
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file
   * @returns {Promise<Object>} Created post
   */
  static async createPost(postData, userId, file) {
    try {
      // Validate panoramic image
      const validation = PanoramaService.validatePanoramicImage(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Upload image to Cloudinary
      const imageResult = await PanoramaService.uploadPanoramicImage(
        file.buffer,
        userId,
        file.originalname
      );

      if (!imageResult.success) {
        return {
          success: false,
          error: 'Failed to upload image'
        };
      }

      // Parse location data if provided
      let location = null;
      if (postData.location) {
        try {
          location = typeof postData.location === 'string' 
            ? JSON.parse(postData.location) 
            : postData.location;
        } catch (error) {
          console.error('Invalid location data:', error);
        }
      }

      // Parse tags if provided
      let tags = [];
      if (postData.tags) {
        try {
          tags = Array.isArray(postData.tags) 
            ? postData.tags 
            : JSON.parse(postData.tags);
          
          // Limit to 10 tags and validate each tag
          tags = tags.slice(0, 10).filter(tag => 
            typeof tag === 'string' && tag.length > 0 && tag.length <= 50
          );
        } catch (error) {
          console.error('Invalid tags data:', error);
          tags = [];
        }
      }

      // Create post document
      const post = await databases.createDocument(
        DATABASE_ID,
        postsCollectionId,
        'unique()',
        {
          authorId: userId,
          caption: postData.caption,
          imageUrl: imageResult.url,
          imagePublicId: imageResult.publicId,
          location: location ? JSON.stringify(location) : null,
          tags: tags,
          isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
          status: 'published',
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          imageMetadata: JSON.stringify({
            width: imageResult.width,
            height: imageResult.height,
            format: imageResult.format,
            size: imageResult.bytes,
            aspectRatio: imageResult.aspectRatio,
            isEquirectangular: imageResult.isEquirectangular,
            thumbnailUrl: imageResult.thumbnailUrl,
            mediumUrl: imageResult.mediumUrl
          })
        }
      );

      return {
        success: true,
        data: {
          post: {
            ...post,
            location: location,
            imageMetadata: {
              width: imageResult.width,
              height: imageResult.height,
              format: imageResult.format,
              size: imageResult.bytes,
              aspectRatio: imageResult.aspectRatio,
              isEquirectangular: imageResult.isEquirectangular,
              thumbnailUrl: imageResult.thumbnailUrl,
              mediumUrl: imageResult.mediumUrl
            }
          }
        }
      };
    } catch (error) {
      console.error('Create post error:', error);
      return {
        success: false,
        error: 'Failed to create post',
        details: error.message
      };
    }
  }

  /**
   * Get posts feed with pagination
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   * @param {string} userId - Current user ID (optional)
   * @param {string} targetUserId - Filter by specific user (optional)
   * @returns {Promise<Object>} Posts feed
   */
  static async getPostsFeed(page = 1, limit = 20, userId = null, targetUserId = null) {
    try {
      const offset = (page - 1) * limit;
      
      // Build query filters
      const queries = [
        Query.equal('status', 'published'),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      // Filter by specific user if provided
      if (targetUserId) {
        queries.push(Query.equal('authorId', targetUserId));
      } else {
        // Only show public posts if not filtering by specific user
        queries.push(Query.equal('isPublic', true));
      }

      // Get posts
      const postsResponse = await databases.listDocuments(
        DATABASE_ID,
        postsCollectionId,
        queries
      );

      // Get author information for each post
      const postsWithAuthors = await Promise.all(
        postsResponse.documents.map(async (post) => {
          try {
            // Get author data
            const authorResponse = await databases.listDocuments(
              DATABASE_ID,
              usersCollectionId,
              [Query.equal('userId', post.authorId)]
            );

            const author = authorResponse.documents[0] || null;

            // Parse JSON fields
            const location = post.location ? JSON.parse(post.location) : null;
            const imageMetadata = post.imageMetadata ? JSON.parse(post.imageMetadata) : null;

            return {
              ...post,
              location,
              imageMetadata,
              author: author ? {
                id: author.userId,
                name: author.name,
                email: author.email
              } : null
            };
          } catch (error) {
            console.error('Error fetching author for post:', post.$id, error);
            return {
              ...post,
              location: post.location ? JSON.parse(post.location) : null,
              imageMetadata: post.imageMetadata ? JSON.parse(post.imageMetadata) : null,
              author: null
            };
          }
        })
      );

      // Get total count for pagination
      const totalResponse = await databases.listDocuments(
        DATABASE_ID,
        postsCollectionId,
        targetUserId 
          ? [Query.equal('authorId', targetUserId), Query.equal('status', 'published')]
          : [Query.equal('isPublic', true), Query.equal('status', 'published')]
      );

      return {
        success: true,
        data: {
          posts: postsWithAuthors,
          pagination: {
            page: page,
            limit: limit,
            total: totalResponse.total,
            totalPages: Math.ceil(totalResponse.total / limit),
            hasNextPage: page < Math.ceil(totalResponse.total / limit),
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Get posts feed error:', error);
      return {
        success: false,
        error: 'Failed to fetch posts',
        details: error.message
      };
    }
  }

  /**
   * Get single post by ID with detailed information
   * @param {string} postId - Post ID
   * @param {string} userId - Current user ID (optional)
   * @returns {Promise<Object>} Post details
   */
  static async getPostById(postId, userId = null) {
    try {
      // Get post
      const post = await databases.getDocument(
        DATABASE_ID,
        postsCollectionId,
        postId
      );

      // Check if post is accessible
      if (!post.isPublic && post.authorId !== userId) {
        return {
          success: false,
          error: 'Post not found or not accessible'
        };
      }

      // Get author information
      const authorResponse = await databases.listDocuments(
        DATABASE_ID,
        usersCollectionId,
        [Query.equal('userId', post.authorId)]
      );

      const author = authorResponse.documents[0] || null;

      // Parse JSON fields
      const location = post.location ? JSON.parse(post.location) : null;
      const imageMetadata = post.imageMetadata ? JSON.parse(post.imageMetadata) : null;

      // Increment view count
      await databases.updateDocument(
        DATABASE_ID,
        postsCollectionId,
        postId,
        {
          viewsCount: post.viewsCount + 1
        }
      );

      return {
        success: true,
        data: {
          post: {
            ...post,
            location,
            imageMetadata,
            viewsCount: post.viewsCount + 1
          },
          author: author ? {
            id: author.userId,
            name: author.name,
            email: author.email,
            bio: author.bio || ''
          } : null
        }
      };
    } catch (error) {
      console.error('Get post by ID error:', error);
      return {
        success: false,
        error: 'Post not found',
        details: error.message
      };
    }
  }

  /**
   * Update post
   * @param {string} postId - Post ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  static async updatePost(postId, updateData, userId) {
    try {
      // Get existing post
      const existingPost = await databases.getDocument(
        DATABASE_ID,
        postsCollectionId,
        postId
      );

      // Check ownership
      if (existingPost.authorId !== userId) {
        return {
          success: false,
          error: 'Unauthorized: You can only update your own posts'
        };
      }

      // Prepare update data
      const updates = {};
      
      if (updateData.caption !== undefined) {
        updates.caption = updateData.caption;
      }
      
      if (updateData.location !== undefined) {
        updates.location = updateData.location ? JSON.stringify(updateData.location) : null;
      }
      
      if (updateData.tags !== undefined) {
        const tags = Array.isArray(updateData.tags) ? updateData.tags : [];
        updates.tags = tags.slice(0, 10).filter(tag => 
          typeof tag === 'string' && tag.length > 0 && tag.length <= 50
        );
      }
      
      if (updateData.isPublic !== undefined) {
        updates.isPublic = updateData.isPublic;
      }

      // Update post
      const updatedPost = await databases.updateDocument(
        DATABASE_ID,
        postsCollectionId,
        postId,
        updates
      );

      return {
        success: true,
        data: {
          post: {
            ...updatedPost,
            location: updatedPost.location ? JSON.parse(updatedPost.location) : null,
            imageMetadata: updatedPost.imageMetadata ? JSON.parse(updatedPost.imageMetadata) : null
          }
        }
      };
    } catch (error) {
      console.error('Update post error:', error);
      return {
        success: false,
        error: 'Failed to update post',
        details: error.message
      };
    }
  }

  /**
   * Delete post and associated data
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  static async deletePost(postId, userId) {
    try {
      // Get existing post
      const existingPost = await databases.getDocument(
        DATABASE_ID,
        postsCollectionId,
        postId
      );

      // Check ownership
      if (existingPost.authorId !== userId) {
        return {
          success: false,
          error: 'Unauthorized: You can only delete your own posts'
        };
      }

      // Delete image from Cloudinary
      if (existingPost.imagePublicId) {
        try {
          await PanoramaService.deletePanoramicImage(existingPost.imagePublicId);
        } catch (error) {
          console.error('Failed to delete image from Cloudinary:', error);
          // Continue with post deletion even if image deletion fails
        }
      }

      // Delete post
      await databases.deleteDocument(
        DATABASE_ID,
        postsCollectionId,
        postId
      );

      return {
        success: true,
        message: 'Post deleted successfully'
      };
    } catch (error) {
      console.error('Delete post error:', error);
      return {
        success: false,
        error: 'Failed to delete post',
        details: error.message
      };
    }
  }
}

module.exports = PostService;
