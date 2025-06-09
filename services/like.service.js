const { Query } = require('node-appwrite');
const { databases, databaseId: DATABASE_ID, postsCollectionId, postLikesCollectionId, usersCollectionId } = require('../config/appwrite');

/**
 * Like Service Functions
 */
class LikeService {
  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Like toggle result
   */
  static async toggleLike(postId, userId) {
    try {
      // Check if post exists
      const post = await databases.getDocument(
        DATABASE_ID,
        postsCollectionId,
        postId
      );

      if (!post) {
        return {
          success: false,
          error: 'Post not found'
        };
      }

      // Check if user already liked this post
      const existingLikes = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [
          Query.equal('postId', postId),
          Query.equal('userId', userId)
        ]
      );

      let isLiked = false;
      let newLikesCount = post.likesCount;

      if (existingLikes.documents.length > 0) {
        // User already liked the post, so unlike it
        await databases.deleteDocument(
          DATABASE_ID,
          postLikesCollectionId,
          existingLikes.documents[0].$id
        );
        
        newLikesCount = Math.max(0, post.likesCount - 1);
        isLiked = false;
      } else {
        // User hasn't liked the post, so like it
        await databases.createDocument(
          DATABASE_ID,
          postLikesCollectionId,
          'unique()',
          {
            postId: postId,
            userId: userId
          }
        );
        
        newLikesCount = post.likesCount + 1;
        isLiked = true;
      }

      // Update post likes count
      await databases.updateDocument(
        DATABASE_ID,
        postsCollectionId,
        postId,
        {
          likesCount: newLikesCount
        }
      );

      return {
        success: true,
        data: {
          isLiked: isLiked,
          likesCount: newLikesCount,
          postId: postId,
          userId: userId
        }
      };
    } catch (error) {
      console.error('Toggle like error:', error);
      return {
        success: false,
        error: 'Failed to toggle like',
        details: error.message
      };
    }
  }

  /**
   * Check if user has liked a specific post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Like status
   */
  static async checkUserLike(postId, userId) {
    try {
      const existingLikes = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [
          Query.equal('postId', postId),
          Query.equal('userId', userId)
        ]
      );

      return {
        success: true,
        data: {
          isLiked: existingLikes.documents.length > 0,
          postId: postId,
          userId: userId
        }
      };
    } catch (error) {
      console.error('Check user like error:', error);
      return {
        success: false,
        error: 'Failed to check like status',
        details: error.message
      };
    }
  }

  /**
   * Get users who liked a specific post
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} limit - Likes per page
   * @returns {Promise<Object>} Users who liked the post
   */
  static async getPostLikes(postId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Get likes for the post
      const likesResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [
          Query.equal('postId', postId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      // Get user information for each like
      const likesWithUsers = await Promise.all(
        likesResponse.documents.map(async (like) => {
          try {
            // Get user data
            const userResponse = await databases.listDocuments(
              DATABASE_ID,
              usersCollectionId,
              [Query.equal('userId', like.userId)]
            );

            const user = userResponse.documents[0] || null;

            return {
              likeId: like.$id,
              likedAt: like.$createdAt,
              user: user ? {
                id: user.userId,
                name: user.name,
                email: user.email
              } : null
            };
          } catch (error) {
            console.error('Error fetching user for like:', like.$id, error);
            return {
              likeId: like.$id,
              likedAt: like.$createdAt,
              user: null
            };
          }
        })
      );

      // Get total count for pagination
      const totalResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [Query.equal('postId', postId)]
      );

      return {
        success: true,
        data: {
          likes: likesWithUsers,
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
      console.error('Get post likes error:', error);
      return {
        success: false,
        error: 'Failed to fetch post likes',
        details: error.message
      };
    }
  }

  /**
   * Get posts liked by a specific user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   * @returns {Promise<Object>} Posts liked by user
   */
  static async getUserLikes(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Get likes by the user
      const likesResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      // Get post information for each like
      const likedPosts = await Promise.all(
        likesResponse.documents.map(async (like) => {
          try {
            // Get post data
            const post = await databases.getDocument(
              DATABASE_ID,
              postsCollectionId,
              like.postId
            );

            // Get post author data
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
              likedAt: like.$createdAt,
              post: {
                ...post,
                location,
                imageMetadata,
                author: author ? {
                  id: author.userId,
                  name: author.name,
                  email: author.email
                } : null
              }
            };
          } catch (error) {
            console.error('Error fetching post for like:', like.$id, error);
            return null;
          }
        })
      );

      // Filter out null results (posts that couldn't be fetched)
      const validLikedPosts = likedPosts.filter(item => item !== null);

      // Get total count for pagination
      const totalResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [Query.equal('userId', userId)]
      );

      return {
        success: true,
        data: {
          likedPosts: validLikedPosts,
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
      console.error('Get user likes error:', error);
      return {
        success: false,
        error: 'Failed to fetch user likes',
        details: error.message
      };
    }
  }

  /**
   * Get like statistics for a post
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Like statistics
   */
  static async getLikeStats(postId) {
    try {
      // Get total likes count
      const likesResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [Query.equal('postId', postId)]
      );

      // Get recent likes (last 5)
      const recentLikesResponse = await databases.listDocuments(
        DATABASE_ID,
        postLikesCollectionId,
        [
          Query.equal('postId', postId),
          Query.orderDesc('$createdAt'),
          Query.limit(5)
        ]
      );

      // Get user information for recent likes
      const recentLikesWithUsers = await Promise.all(
        recentLikesResponse.documents.map(async (like) => {
          try {
            const userResponse = await databases.listDocuments(
              DATABASE_ID,
              usersCollectionId,
              [Query.equal('userId', like.userId)]
            );

            const user = userResponse.documents[0] || null;

            return {
              likedAt: like.$createdAt,
              user: user ? {
                id: user.userId,
                name: user.name
              } : null
            };
          } catch (error) {
            return null;
          }
        })
      );

      return {
        success: true,
        data: {
          totalLikes: likesResponse.total,
          recentLikes: recentLikesWithUsers.filter(item => item !== null)
        }
      };
    } catch (error) {
      console.error('Get like stats error:', error);
      return {
        success: false,
        error: 'Failed to fetch like statistics',
        details: error.message
      };
    }
  }
}

module.exports = LikeService;
