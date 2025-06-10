# Post Functionality API Endpoints Documentation

This document provides comprehensive documentation for all API endpoints related to the post functionality in the Cultural Touristic Web App backend.

## Base URL
All endpoints are prefixed with `/api/posts`

## Authentication
- **Protected endpoints** require a Bearer token in the Authorization header
- **Optional authentication** endpoints work with or without authentication
- **Public endpoints** do not require authentication

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional error details"
}
```

## Post Management Endpoints

### 1. Create Post
**POST** `/api/posts`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Request Body:**
```
image: File (required) - 360-degree panoramic image
caption: String (required, max: 2000 characters)
location: JSON String (optional) - Location object
tags: JSON String (optional) - Array of strings, max 10 items
isPublic: Boolean (optional, default: true)
```

**Example Request:**
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('caption', 'Amazing 360-degree view from the mountain top!');
formData.append('location', JSON.stringify({
  name: "Mount Everest Base Camp",
  city: "Buea",
  country: "Cameroon"
}));
formData.append('tags', JSON.stringify(['mountain', 'adventure', 'hiking']));
formData.append('isPublic', true);
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "$id": "post_123",
    "authorId": "user_456",
    "caption": "Amazing 360-degree view from the mountain top!",
    "imageUrl": "https://res.cloudinary.com/...",
    "imagePublicId": "posts/user_456/image_123",
    "location": {
      "name": "Mount Everest Base Camp",
      "city": "Buea",
      "country": "Cameroon"
    },
    "tags": ["mountain", "adventure", "hiking"],
    "isPublic": true,
    "status": "published",
    "likesCount": 0,
    "commentsCount": 0,
    "viewsCount": 0,
    "imageMetadata": {
      "width": 4096,
      "height": 2048,
      "format": "jpg",
      "size": 2048576,
      "aspectRatio": 2.0,
      "isEquirectangular": true,
      "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail",
      "mediumUrl": "https://res.cloudinary.com/.../medium"
    },
    "$createdAt": "2024-01-15T10:30:00.000Z",
    "$updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Posts Feed
**GET** `/api/posts`

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Posts per page (default: 20, min: 1, max: 50)
- `userId` (optional): Filter posts by specific user ID

**Example Request:**
```
GET /api/posts?page=1&limit=10&userId=user_456
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "$id": "post_123",
        "authorId": "user_456",
        "caption": "Amazing 360-degree view!",
        "imageUrl": "https://res.cloudinary.com/...",
        "location": {
          "name": "Mount Everest Base Camp",
          "latitude": 28.0026,
          "longitude": 86.8528
        },
        "tags": ["mountain", "adventure"],
        "isPublic": true,
        "status": "published",
        "likesCount": 42,
        "commentsCount": 15,
        "viewsCount": 250,
        "imageMetadata": {
          "width": 4096,
          "height": 2048,
          "format": "jpg",
          "size": 2048576,
          "aspectRatio": 2.0,
          "isEquirectangular": true,
          "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail",
          "mediumUrl": "https://res.cloudinary.com/.../medium"
        },
        "author": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "$createdAt": "2024-01-15T10:30:00.000Z",
        "$updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Single Post
**GET** `/api/posts/:id`

**Authentication:** Optional

**Path Parameters:**
- `id` (required): Post ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "post": {
      "$id": "post_123",
      "authorId": "user_456",
      "caption": "Amazing 360-degree view!",
      "imageUrl": "https://res.cloudinary.com/...",
      "location": {
        "name": "Mount Everest Base Camp",
        "latitude": 28.0026,
        "longitude": 86.8528
      },
      "tags": ["mountain", "adventure"],
      "isPublic": true,
      "status": "published",
      "likesCount": 42,
      "commentsCount": 15,
      "viewsCount": 251,
      "imageMetadata": {
        "width": 4096,
        "height": 2048,
        "format": "jpg",
        "size": 2048576,
        "aspectRatio": 2.0,
        "isEquirectangular": true,
        "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail",
        "mediumUrl": "https://res.cloudinary.com/.../medium"
      },
      "$createdAt": "2024-01-15T10:30:00.000Z",
      "$updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "author": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com",
      "bio": "Adventure photographer"
    }
  }
}
```

### 4. Update Post
**PUT** `/api/posts/:id`

**Authentication:** Required (Owner only)

**Content-Type:** `application/json`

**Path Parameters:**
- `id` (required): Post ID

**Request Body:**
```json
{
  "caption": "Updated caption text (max 2000 characters)",
  "location": {
    "name": "Updated location name",
    "latitude": 28.0026,
    "longitude": 86.8528
  },
  "tags": ["updated", "tags", "array"],
  "isPublic": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    // Updated post object (same structure as create response)
  }
}
```

### 5. Delete Post
**DELETE** `/api/posts/:id`

**Authentication:** Required (Owner only)

**Path Parameters:**
- `id` (required): Post ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### 6. Search Posts
**GET** `/api/posts/search`

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Posts per page (default: 20, min: 1, max: 50)
- `tags` (optional): Tags to search for (JSON array or comma-separated string)
- `location` (optional): Location name to search for
- `city` (optional): City name to search for
- `country` (optional): Country name to search for
- `sortBy` (optional): Sort order - 'newest' (default), 'oldest', or 'popular'

**Note:** At least one search parameter (tags, location, city, or country) must be provided.

**Example Requests:**
```
GET /api/posts/search?tags=["mountain","adventure"]&page=1&limit=10
GET /api/posts/search?tags=mountain,adventure&city=Buea&sortBy=popular
GET /api/posts/search?location=Mount%20Everest&country=Nepal
GET /api/posts/search?city=Paris&sortBy=newest
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "$id": "post_123",
        "authorId": "user_456",
        "caption": "Amazing 360-degree view from Mount Everest!",
        "imageUrl": "https://res.cloudinary.com/...",
        "location": {
          "name": "Mount Everest Base Camp",
          "city": "Solukhumbu",
          "country": "Nepal",
          "latitude": 28.0026,
          "longitude": 86.8528
        },
        "tags": ["mountain", "adventure", "hiking", "nepal"],
        "isPublic": true,
        "status": "published",
        "likesCount": 42,
        "commentsCount": 15,
        "viewsCount": 250,
        "imageMetadata": {
          "width": 4096,
          "height": 2048,
          "format": "jpg",
          "size": 2048576,
          "aspectRatio": 2.0,
          "isEquirectangular": true,
          "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail",
          "mediumUrl": "https://res.cloudinary.com/.../medium"
        },
        "author": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "$createdAt": "2024-01-15T10:30:00.000Z",
        "$updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "searchParams": {
      "tags": ["mountain", "adventure"],
      "location": null,
      "city": "Buea",
      "country": null,
      "sortBy": "popular"
    }
  }
}
```

### 7. Get User's Posts
**GET** `/api/posts/user/:userId`

**Authentication:** Optional

**Path Parameters:**
- `userId` (required): User ID

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Posts per page (default: 20, min: 1, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      // Array of post objects (same structure as posts feed)
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Like Management Endpoints

### 8. Toggle Like
**POST** `/api/posts/:postId/likes`

**Authentication:** Required

**Path Parameters:**
- `postId` (required): Post ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post liked successfully", // or "Post unliked successfully"
  "data": {
    "isLiked": true,
    "likesCount": 43,
    "postId": "post_123",
    "userId": "user_456"
  }
}
```

### 9. Check User Like Status
**GET** `/api/posts/:postId/likes/check`

**Authentication:** Optional

**Path Parameters:**
- `postId` (required): Post ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "postId": "post_123",
    "userId": "user_456" // null if not authenticated
  }
}
```

### 10. Get Post Likes
**GET** `/api/posts/:postId/likes`

**Authentication:** Public

**Path Parameters:**
- `postId` (required): Post ID

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Likes per page (default: 20, min: 1, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "likes": [
      {
        "$id": "like_123",
        "postId": "post_123",
        "userId": "user_456",
        "user": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "$createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 11. Get Like Statistics
**GET** `/api/posts/:postId/likes/stats`

**Authentication:** Public

**Path Parameters:**
- `postId` (required): Post ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "postId": "post_123",
    "totalLikes": 42,
    "recentLikes": [
      {
        "userId": "user_456",
        "userName": "John Doe",
        "likedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 12. Get User's Liked Posts
**GET** `/api/posts/users/:userId/likes`

**Authentication:** Public

**Path Parameters:**
- `userId` (required): User ID

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Posts per page (default: 20, min: 1, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      // Array of post objects that the user has liked
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Comment Management Endpoints

### 13. Add Comment
**POST** `/api/posts/:postId/comments`

**Authentication:** Required

**Content-Type:** `application/json`

**Path Parameters:**
- `postId` (required): Post ID

**Request Body:**
```json
{
  "content": "Amazing 360-degree view! How long did it take to reach the summit?",
  "parentCommentId": "comment_456" // Optional, for replies
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "$id": "comment_789",
    "postId": "post_123",
    "authorId": "user_456",
    "content": "Amazing 360-degree view! How long did it take to reach the summit?",
    "isEdited": false,
    "parentCommentId": null,
    "repliesCount": 0,
    "author": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "$createdAt": "2024-01-15T10:30:00.000Z",
    "$updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 14. Get Post Comments
**GET** `/api/posts/:postId/comments`

**Authentication:** Public

**Path Parameters:**
- `postId` (required): Post ID

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Comments per page (default: 20, min: 1, max: 50)
- `includeReplies` (optional): Include nested replies (default: false)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "$id": "comment_789",
        "postId": "post_123",
        "authorId": "user_456",
        "content": "Amazing 360-degree view!",
        "isEdited": false,
        "parentCommentId": null,
        "repliesCount": 2,
        "author": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "replies": [
          {
            "$id": "comment_790",
            "postId": "post_123",
            "authorId": "user_789",
            "content": "Thanks! It took about 3 hours.",
            "isEdited": false,
            "parentCommentId": "comment_789",
            "repliesCount": 0,
            "author": {
              "id": "user_789",
              "name": "Jane Smith",
              "email": "jane@example.com"
            },
            "$createdAt": "2024-01-15T11:00:00.000Z",
            "$updatedAt": "2024-01-15T11:00:00.000Z"
          }
        ],
        "$createdAt": "2024-01-15T10:30:00.000Z",
        "$updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 15. Update Comment
**PUT** `/api/posts/:postId/comments/:commentId`

**Authentication:** Required (Owner only)

**Content-Type:** `application/json`

**Path Parameters:**
- `postId` (required): Post ID
- `commentId` (required): Comment ID

**Request Body:**
```json
{
  "content": "Updated comment content (max 1000 characters)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "$id": "comment_789",
    "postId": "post_123",
    "authorId": "user_456",
    "content": "Updated comment content",
    "isEdited": true,
    "parentCommentId": null,
    "repliesCount": 0,
    "author": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "$createdAt": "2024-01-15T10:30:00.000Z",
    "$updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 16. Delete Comment
**DELETE** `/api/posts/:postId/comments/:commentId`

**Authentication:** Required (Owner only)

**Path Parameters:**
- `postId` (required): Post ID
- `commentId` (required): Comment ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### 17. Get Comment Replies
**GET** `/api/posts/:postId/comments/:commentId/replies`

**Authentication:** Public

**Path Parameters:**
- `postId` (required): Post ID
- `commentId` (required): Parent comment ID

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Replies per page (default: 20, min: 1, max: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "replies": [
      {
        "$id": "comment_790",
        "postId": "post_123",
        "authorId": "user_789",
        "content": "Thanks! It took about 3 hours.",
        "isEdited": false,
        "parentCommentId": "comment_789",
        "repliesCount": 0,
        "author": {
          "id": "user_789",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "$createdAt": "2024-01-15T11:00:00.000Z",
        "$updatedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

## Error Responses

### Common Error Status Codes

- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have permission to perform the action
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

### Example Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Caption is required and must be less than 2000 characters",
  "details": [
    {
      "field": "caption",
      "message": "Caption is required and must be less than 2000 characters"
    }
  ]
}
```

**Unauthorized Error (401):**
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

**Forbidden Error (403):**
```json
{
  "success": false,
  "error": "Unauthorized: You can only update your own posts"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": "Post not found"
}
```

## Data Models

### Post Object
```typescript
interface Post {
  $id: string;                    // Unique post identifier
  $createdAt: string;             // ISO 8601 timestamp
  $updatedAt: string;             // ISO 8601 timestamp

  authorId: string;               // User ID of post author
  caption: string;                // Post caption (max 2000 chars)
  imageUrl: string;               // Cloudinary image URL
  imagePublicId: string;          // Cloudinary public ID
  location?: {                    // Optional location object
    name: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];                 // Array of tags (max 10)
  isPublic: boolean;              // Visibility setting
  status: 'draft' | 'published' | 'archived';

  // Engagement metrics
  likesCount: number;             // Total likes count
  commentsCount: number;          // Total comments count
  viewsCount: number;             // Total views count

  // Image metadata
  imageMetadata: {
    width: number;                // Image width in pixels
    height: number;               // Image height in pixels
    format: string;               // Image format (jpg, png, etc.)
    size: number;                 // File size in bytes
    aspectRatio: number;          // Width/height ratio
    isEquirectangular: boolean;   // 360-degree format validation
    thumbnailUrl: string;         // Thumbnail version URL
    mediumUrl: string;            // Medium size version URL
  };
}
```

### User Object (Author)
```typescript
interface User {
  id: string;                     // User ID
  name: string;                   // User's display name
  email: string;                  // User's email
  bio?: string;                   // Optional user bio
}
```

### Comment Object
```typescript
interface Comment {
  $id: string;                    // Unique comment identifier
  $createdAt: string;             // ISO 8601 timestamp
  $updatedAt: string;             // ISO 8601 timestamp

  postId: string;                 // Reference to post
  authorId: string;               // User ID of comment author
  content: string;                // Comment text (max 1000 chars)
  isEdited: boolean;              // Whether comment was edited

  parentCommentId?: string;       // For nested replies
  repliesCount: number;           // Number of replies

  author: User;                   // Author information
  replies?: Comment[];            // Nested replies (if included)
}
```

### Like Object
```typescript
interface Like {
  $id: string;                    // Unique like identifier
  $createdAt: string;             // ISO 8601 timestamp

  postId: string;                 // Reference to post
  userId: string;                 // User who liked the post
  user?: User;                    // User information (if included)
}
```

### Pagination Object
```typescript
interface Pagination {
  page: number;                   // Current page number
  limit: number;                  // Items per page
  total: number;                  // Total number of items
  totalPages: number;             // Total number of pages
  hasNextPage: boolean;           // Whether there's a next page
  hasPrevPage: boolean;           // Whether there's a previous page
}
```

## Notes

1. **Image Requirements**: All post images must be 360-degree panoramic images in equirectangular format
2. **File Upload**: Maximum file size is typically 10MB (configured in middleware)
3. **Rate Limiting**: API endpoints may have rate limiting applied
4. **Pagination**: All list endpoints support pagination with consistent format
5. **Authentication**: JWT tokens are used for authentication with Bearer scheme
6. **Cloudinary Integration**: Images are stored and processed using Cloudinary service
7. **Real-time Updates**: Consider implementing WebSocket connections for real-time like/comment updates
        "userId": "user_456",
        "user": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "$createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```
