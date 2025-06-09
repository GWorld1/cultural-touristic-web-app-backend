const { Query } = require('node-appwrite');
const { databases, databaseId: DATABASE_ID, postsCollectionId, postCommentsCollectionId, usersCollectionId } = require('../config/appwrite');

/**
 * Comment Service Functions
 */
class CommentService {
  /**
   * Add a comment to a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {string} content - Comment content
   * @param {string} parentCommentId - Parent comment ID for replies (optional)
   * @returns {Promise<Object>} Created comment
   */
  static async addComment(postId, userId, content, parentCommentId = null) {
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

      // Validate content
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: 'Comment content is required'
        };
      }

      if (content.length > 1000) {
        return {
          success: false,
          error: 'Comment must be less than 1000 characters'
        };
      }

      // If this is a reply, check if parent comment exists
      if (parentCommentId) {
        try {
          const parentComment = await databases.getDocument(
            DATABASE_ID,
            postCommentsCollectionId,
            parentCommentId
          );

          // Ensure parent comment belongs to the same post
          if (parentComment.postId !== postId) {
            return {
              success: false,
              error: 'Parent comment does not belong to this post'
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Parent comment not found'
          };
        }
      }

      // Create comment
      const comment = await databases.createDocument(
        DATABASE_ID,
        postCommentsCollectionId,
        'unique()',
        {
          postId: postId,
          authorId: userId,
          content: content.trim(),
          isEdited: false,
          parentCommentId: parentCommentId,
          repliesCount: 0
        }
      );

      // Update post comments count
      await databases.updateDocument(
        DATABASE_ID,
        postsCollectionId,
        postId,
        {
          commentsCount: post.commentsCount + 1
        }
      );

      // If this is a reply, update parent comment replies count
      if (parentCommentId) {
        try {
          const parentComment = await databases.getDocument(
            DATABASE_ID,
            postCommentsCollectionId,
            parentCommentId
          );

          await databases.updateDocument(
            DATABASE_ID,
            postCommentsCollectionId,
            parentCommentId,
            {
              repliesCount: parentComment.repliesCount + 1
            }
          );
        } catch (error) {
          console.error('Failed to update parent comment replies count:', error);
        }
      }

      // Get author information
      const authorResponse = await databases.listDocuments(
        DATABASE_ID,
        usersCollectionId,
        [Query.equal('userId', userId)]
      );

      const author = authorResponse.documents[0] || null;

      return {
        success: true,
        data: {
          comment: {
            ...comment,
            author: author ? {
              id: author.userId,
              name: author.name,
              email: author.email
            } : null
          }
        }
      };
    } catch (error) {
      console.error('Add comment error:', error);
      return {
        success: false,
        error: 'Failed to add comment',
        details: error.message
      };
    }
  }

  /**
   * Get comments for a post with pagination
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} limit - Comments per page
   * @param {boolean} includeReplies - Whether to include replies
   * @returns {Promise<Object>} Comments list
   */
  static async getPostComments(postId, page = 1, limit = 20, includeReplies = false) {
    try {
      const offset = (page - 1) * limit;

      // Build query filters
      const queries = [
        Query.equal('postId', postId),
        Query.orderAsc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      // If not including replies, only get top-level comments
      if (!includeReplies) {
        queries.push(Query.isNull('parentCommentId'));
      }

      // Get comments
      const commentsResponse = await databases.listDocuments(
        DATABASE_ID,
        postCommentsCollectionId,
        queries
      );

      // Get author information for each comment
      const commentsWithAuthors = await Promise.all(
        commentsResponse.documents.map(async (comment) => {
          try {
            // Get author data
            const authorResponse = await databases.listDocuments(
              DATABASE_ID,
              usersCollectionId,
              [Query.equal('userId', comment.authorId)]
            );

            const author = authorResponse.documents[0] || null;

            // If this is a top-level comment and we want replies, get them
            let replies = [];
            if (!comment.parentCommentId && includeReplies && comment.repliesCount > 0) {
              const repliesResponse = await databases.listDocuments(
                DATABASE_ID,
                postCommentsCollectionId,
                [
                  Query.equal('parentCommentId', comment.$id),
                  Query.orderAsc('$createdAt'),
                  Query.limit(5) // Limit replies to 5 per comment
                ]
              );

              // Get author info for replies
              replies = await Promise.all(
                repliesResponse.documents.map(async (reply) => {
                  try {
                    const replyAuthorResponse = await databases.listDocuments(
                      DATABASE_ID,
                      usersCollectionId,
                      [Query.equal('userId', reply.authorId)]
                    );

                    const replyAuthor = replyAuthorResponse.documents[0] || null;

                    return {
                      ...reply,
                      author: replyAuthor ? {
                        id: replyAuthor.userId,
                        name: replyAuthor.name,
                        email: replyAuthor.email
                      } : null
                    };
                  } catch (error) {
                    console.error('Error fetching reply author:', error);
                    return {
                      ...reply,
                      author: null
                    };
                  }
                })
              );
            }

            return {
              ...comment,
              author: author ? {
                id: author.userId,
                name: author.name,
                email: author.email
              } : null,
              replies: replies
            };
          } catch (error) {
            console.error('Error fetching comment author:', error);
            return {
              ...comment,
              author: null,
              replies: []
            };
          }
        })
      );

      // Get total count for pagination
      const totalQueries = [Query.equal('postId', postId)];
      if (!includeReplies) {
        totalQueries.push(Query.isNull('parentCommentId'));
      }

      const totalResponse = await databases.listDocuments(
        DATABASE_ID,
        postCommentsCollectionId,
        totalQueries
      );

      return {
        success: true,
        data: {
          comments: commentsWithAuthors,
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
      console.error('Get post comments error:', error);
      return {
        success: false,
        error: 'Failed to fetch comments',
        details: error.message
      };
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @param {string} content - New content
   * @returns {Promise<Object>} Update result
   */
  static async updateComment(commentId, userId, content) {
    try {
      // Get existing comment
      const existingComment = await databases.getDocument(
        DATABASE_ID,
        postCommentsCollectionId,
        commentId
      );

      // Check ownership
      if (existingComment.authorId !== userId) {
        return {
          success: false,
          error: 'Unauthorized: You can only update your own comments'
        };
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: 'Comment content is required'
        };
      }

      if (content.length > 1000) {
        return {
          success: false,
          error: 'Comment must be less than 1000 characters'
        };
      }

      // Update comment
      const updatedComment = await databases.updateDocument(
        DATABASE_ID,
        postCommentsCollectionId,
        commentId,
        {
          content: content.trim(),
          isEdited: true
        }
      );

      // Get author information
      const authorResponse = await databases.listDocuments(
        DATABASE_ID,
        usersCollectionId,
        [Query.equal('userId', userId)]
      );

      const author = authorResponse.documents[0] || null;

      return {
        success: true,
        data: {
          comment: {
            ...updatedComment,
            author: author ? {
              id: author.userId,
              name: author.name,
              email: author.email
            } : null
          }
        }
      };
    } catch (error) {
      console.error('Update comment error:', error);
      return {
        success: false,
        error: 'Failed to update comment',
        details: error.message
      };
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  static async deleteComment(commentId, userId) {
    try {
      // Get existing comment
      const existingComment = await databases.getDocument(
        DATABASE_ID,
        postCommentsCollectionId,
        commentId
      );

      // Check ownership
      if (existingComment.authorId !== userId) {
        return {
          success: false,
          error: 'Unauthorized: You can only delete your own comments'
        };
      }

      // Get post to update comments count
      const post = await databases.getDocument(
        DATABASE_ID,
        postsCollectionId,
        existingComment.postId
      );

      // Delete all replies to this comment first
      if (existingComment.repliesCount > 0) {
        const replies = await databases.listDocuments(
          DATABASE_ID,
          postCommentsCollectionId,
          [Query.equal('parentCommentId', commentId)]
        );

        await Promise.all(
          replies.documents.map(reply =>
            databases.deleteDocument(DATABASE_ID, postCommentsCollectionId, reply.$id)
          )
        );
      }

      // Delete the comment
      await databases.deleteDocument(
        DATABASE_ID,
        postCommentsCollectionId,
        commentId
      );

      // Update post comments count (subtract 1 + number of replies)
      const totalDeleted = 1 + existingComment.repliesCount;
      await databases.updateDocument(
        DATABASE_ID,
        postsCollectionId,
        existingComment.postId,
        {
          commentsCount: Math.max(0, post.commentsCount - totalDeleted)
        }
      );

      // If this was a reply, update parent comment replies count
      if (existingComment.parentCommentId) {
        try {
          const parentComment = await databases.getDocument(
            DATABASE_ID,
            postCommentsCollectionId,
            existingComment.parentCommentId
          );

          await databases.updateDocument(
            DATABASE_ID,
            postCommentsCollectionId,
            existingComment.parentCommentId,
            {
              repliesCount: Math.max(0, parentComment.repliesCount - 1)
            }
          );
        } catch (error) {
          console.error('Failed to update parent comment replies count:', error);
        }
      }

      return {
        success: true,
        message: 'Comment deleted successfully'
      };
    } catch (error) {
      console.error('Delete comment error:', error);
      return {
        success: false,
        error: 'Failed to delete comment',
        details: error.message
      };
    }
  }

  /**
   * Get replies for a specific comment
   * @param {string} commentId - Parent comment ID
   * @param {number} page - Page number
   * @param {number} limit - Replies per page
   * @returns {Promise<Object>} Replies list
   */
  static async getCommentReplies(commentId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get replies
      const repliesResponse = await databases.listDocuments(
        DATABASE_ID,
        postCommentsCollectionId,
        [
          Query.equal('parentCommentId', commentId),
          Query.orderAsc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      // Get author information for each reply
      const repliesWithAuthors = await Promise.all(
        repliesResponse.documents.map(async (reply) => {
          try {
            const authorResponse = await databases.listDocuments(
              DATABASE_ID,
              usersCollectionId,
              [Query.equal('userId', reply.authorId)]
            );

            const author = authorResponse.documents[0] || null;

            return {
              ...reply,
              author: author ? {
                id: author.userId,
                name: author.name,
                email: author.email
              } : null
            };
          } catch (error) {
            console.error('Error fetching reply author:', error);
            return {
              ...reply,
              author: null
            };
          }
        })
      );

      // Get total count for pagination
      const totalResponse = await databases.listDocuments(
        DATABASE_ID,
        postCommentsCollectionId,
        [Query.equal('parentCommentId', commentId)]
      );

      return {
        success: true,
        data: {
          replies: repliesWithAuthors,
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
      console.error('Get comment replies error:', error);
      return {
        success: false,
        error: 'Failed to fetch replies',
        details: error.message
      };
    }
  }
}

module.exports = CommentService;
