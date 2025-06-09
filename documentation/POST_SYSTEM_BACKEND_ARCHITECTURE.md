# Post System Backend Architecture Plan

## Implementation Strategy

Following the existing codebase patterns from `auth.controller.js`, `tour.controller.js`, and related files.

## File Structure

```
├── controllers/
│   ├── post.controller.js          # Main post operations
│   ├── like.controller.js          # Like/unlike operations
│   └── comment.controller.js       # Comment operations
├── routes/
│   ├── post.routes.js              # Post API routes
│   ├── like.routes.js              # Like API routes
│   └── comment.routes.js           # Comment API routes
├── services/
│   ├── post.service.js             # Post business logic
│   ├── like.service.js             # Like business logic
│   ├── comment.service.js          # Comment business logic
│   └── panorama.service.js         # 360-degree image validation
├── middleware/
│   ├── post.validation.js          # Post-specific validation
│   └── panorama.validation.js     # 360-degree image validation
└── config/
    └── collections.js              # Collection IDs configuration
```

## 1. Collection Configuration

### `config/collections.js`
```javascript
const COLLECTIONS = {
  // Existing collections
  USERS: process.env.APPWRITE_USERS_COLLECTION_ID,
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8',
  
  // New post system collections
  POSTS: process.env.APPWRITE_POSTS_COLLECTION_ID,
  POST_LIKES: process.env.APPWRITE_POST_LIKES_COLLECTION_ID,
  POST_COMMENTS: process.env.APPWRITE_POST_COMMENTS_COLLECTION_ID
};

module.exports = COLLECTIONS;
```

## 2. Post Controller Implementation

### Key Features:
- **Create Post**: Upload 360-degree image + metadata
- **Get Posts**: Paginated feed with user data
- **Get Single Post**: Detailed view with likes/comments
- **Update Post**: Edit caption, location, tags
- **Delete Post**: Remove post and associated data
- **Get User Posts**: User's post history

### Error Handling Pattern (Following auth.controller.js):
```javascript
try {
  // Operation logic
  res.status(200).json({
    success: true,
    data: result
  });
} catch (error) {
  console.error('Operation error:', error);
  
  if (error.code === 404) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  res.status(500).json({ 
    error: 'Failed to perform operation', 
    details: error.message 
  });
}
```

## 3. API Endpoint Structure

### Posts API (`/api/posts`)

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- image: File (required) - 360-degree panoramic image
- caption: String (required, max: 2000)
- location: JSON (optional)
- tags: Array<String> (optional, max: 10)
- isPublic: Boolean (optional, default: true)
```

#### Get Posts Feed
```http
GET /api/posts?page=1&limit=20&userId=optional
Authorization: Bearer <token> (optional)

Response:
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Get Single Post
```http
GET /api/posts/:id
Authorization: Bearer <token> (optional)

Response:
{
  "success": true,
  "data": {
    "post": {...},
    "author": {...},
    "isLiked": true,
    "recentComments": [...],
    "totalComments": 25
  }
}
```

### Likes API (`/api/posts/:postId/likes`)

#### Toggle Like
```http
POST /api/posts/:postId/likes
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 42
  }
}
```

### Comments API (`/api/posts/:postId/comments`)

#### Add Comment
```http
POST /api/posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "content": "Amazing 360-degree view!",
  "parentCommentId": "optional-for-replies"
}
```

#### Get Comments
```http
GET /api/posts/:postId/comments?page=1&limit=10
Authorization: Bearer <token> (optional)

Response:
{
  "success": true,
  "data": {
    "comments": [...],
    "pagination": {...}
  }
}
```

## 4. Service Layer Architecture

### Post Service (`services/post.service.js`)
- **createPost()**: Handle image upload + database creation
- **getPostsFeed()**: Paginated posts with user data
- **getPostById()**: Single post with engagement data
- **updatePost()**: Update post metadata
- **deletePost()**: Cascade delete post and related data
- **getUserPosts()**: User's post history

### Like Service (`services/like.service.js`)
- **toggleLike()**: Like/unlike with count update
- **getUserLikes()**: User's liked posts
- **getPostLikes()**: Users who liked a post

### Comment Service (`services/comment.service.js`)
- **addComment()**: Create comment with count update
- **getComments()**: Paginated comments with user data
- **updateComment()**: Edit comment content
- **deleteComment()**: Remove comment with count update

## 5. Middleware Integration

### Authentication Middleware (Existing)
- `authMiddleware.protect` - Required for create/update/delete
- `authMiddleware.optional` - For public viewing with user context

### Validation Middleware (Following existing pattern)
```javascript
// Post creation validation
body('caption').isString().notEmpty().isLength({ max: 2000 }),
body('location').optional().isJSON(),
body('tags').optional().isArray({ max: 10 }),
body('isPublic').optional().isBoolean(),
```

### File Upload Middleware (Existing)
- `uploadSingle('image')` - Handle 360-degree image upload
- Custom validation for panoramic image format

## 6. Cloudinary Integration

### Image Upload Strategy (Following existing pattern)
```javascript
const result = await CloudinaryService.uploadImage(
  file.buffer,
  'posts',           // resourceType
  userId,            // userId
  file.originalname, // originalName
  {
    // 360-degree specific options
    quality: 'auto:good',
    format: 'jpg',
    transformation: [
      { width: 2048, height: 1024, crop: 'limit' }
    ]
  }
);
```

### Folder Structure
```
posts/
├── user_123456/
│   ├── post_abc123.jpg
│   └── post_def456.jpg
```

## 7. Database Operations Pattern

### Following Existing Appwrite Pattern
```javascript
// Create operation
const post = await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.POSTS,
  'unique()',
  postData
);

// Query with relationships
const posts = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.POSTS,
  [
    Query.equal('isPublic', true),
    Query.equal('status', 'published'),
    Query.orderDesc('$createdAt'),
    Query.limit(20),
    Query.offset((page - 1) * limit)
  ]
);
```

## 8. Error Handling Strategy

### Consistent Error Responses (Following auth.controller.js)
- **400**: Validation errors
- **401**: Authentication required
- **403**: Insufficient permissions
- **404**: Resource not found
- **409**: Conflict (duplicate like)
- **500**: Server errors

## 9. Performance Considerations

### Optimization Strategies:
- **Pagination**: Limit posts per request
- **Eager Loading**: Include user data in post queries
- **Caching**: Cache frequently accessed posts
- **Image Optimization**: Cloudinary transformations
- **Indexes**: Proper database indexing for queries

## 10. Security Measures

### Data Protection:
- **Input Sanitization**: Prevent XSS in captions/comments
- **File Validation**: Ensure valid 360-degree images
- **Rate Limiting**: Prevent spam posting/commenting
- **Authorization**: Users can only edit their own content
- **Content Moderation**: Optional profanity filtering
