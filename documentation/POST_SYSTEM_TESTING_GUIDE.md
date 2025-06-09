# Post System Testing Guide

## Environment Setup for Testing

### 1. Environment Variables
Add these to your `.env` file:
```env
# Existing variables...
APPWRITE_POSTS_COLLECTION_ID=posts
APPWRITE_POST_LIKES_COLLECTION_ID=post_likes
APPWRITE_POST_COMMENTS_COLLECTION_ID=post_comments
```

### 2. Test Database Collections
Create these collections in your Appwrite console with the schemas defined in the database documentation.

## API Testing with Postman/Thunder Client

### 1. Authentication Setup
First, get an authentication token:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

Save the returned token for use in subsequent requests.

### 2. Create Post Test
```http
POST /api/posts
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

Form Data:
- image: [Upload a 360-degree panoramic image file]
- caption: "Amazing 360-degree view from the top of the mountain!"
- location: {"name": "Mount Everest", "latitude": 27.9881, "longitude": 86.9250}
- tags: ["mountain", "panorama", "adventure"]
- isPublic: true
```

Expected Response:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "$id": "unique_post_id",
      "authorId": "user_id",
      "caption": "Amazing 360-degree view from the top of the mountain!",
      "imageUrl": "https://res.cloudinary.com/...",
      "location": {...},
      "tags": ["mountain", "panorama", "adventure"],
      "isPublic": true,
      "likesCount": 0,
      "commentsCount": 0,
      "viewsCount": 0,
      "$createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Get Posts Feed Test
```http
GET /api/posts?page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE (optional)
```

### 4. Like Post Test
```http
POST /api/posts/{POST_ID}/likes
Authorization: Bearer YOUR_TOKEN_HERE
```

### 5. Add Comment Test
```http
POST /api/posts/{POST_ID}/comments
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "content": "Incredible view! How long did it take to reach the summit?"
}
```

## Unit Testing with Jest

### 1. Test Setup
Create `tests/post.test.js`:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Post System', () => {
  let authToken;
  let testPostId;
  let testUserId;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.id;
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid data', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', 'tests/fixtures/test-panorama.jpg')
        .field('caption', 'Test 360-degree post')
        .field('isPublic', 'true');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toBeDefined();
      expect(response.body.data.post.caption).toBe('Test 360-degree post');
      
      testPostId = response.body.data.post.$id;
    });

    it('should reject post without image', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test post without image');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('image');
    });

    it('should reject post without caption', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', 'tests/fixtures/test-panorama.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posts', () => {
    it('should get posts feed', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(Array.isArray(response.body.data.posts)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get single post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPostId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.$id).toBe(testPostId);
    });
  });

  describe('POST /api/posts/:postId/likes', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPostId}/likes`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isLiked).toBe(true);
      expect(response.body.data.likesCount).toBe(1);
    });

    it('should unlike a post when liked again', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPostId}/likes`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isLiked).toBe(false);
      expect(response.body.data.likesCount).toBe(0);
    });
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should add a comment to a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Great 360-degree view!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('Great 360-degree view!');
    });

    it('should get comments for a post', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPostId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.comments)).toBe(true);
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testPostId) {
      await request(app)
        .delete(`/api/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});
```

### 2. Service Unit Tests
Create `tests/services/post.service.test.js`:

```javascript
const PostService = require('../../services/post.service');

describe('PostService', () => {
  describe('createPost', () => {
    it('should validate required fields', async () => {
      const result = await PostService.createPost({}, 'user123', null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPostsFeed', () => {
    it('should return paginated results', async () => {
      const result = await PostService.getPostsFeed(1, 10);
      
      expect(result.success).toBe(true);
      expect(result.data.pagination).toBeDefined();
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(10);
    });
  });
});
```

## Manual Testing Checklist

### Post Creation
- [ ] Upload valid 360-degree image (2:1 aspect ratio)
- [ ] Upload invalid image format
- [ ] Upload image larger than 10MB
- [ ] Create post with caption only
- [ ] Create post with caption and location
- [ ] Create post with tags
- [ ] Create private post
- [ ] Create public post

### Post Viewing
- [ ] View posts feed without authentication
- [ ] View posts feed with authentication
- [ ] View single post
- [ ] View private post (owner vs non-owner)
- [ ] Test 360-degree image viewer functionality
- [ ] Test responsive design on mobile/tablet/desktop

### Like Functionality
- [ ] Like a post
- [ ] Unlike a post
- [ ] View like count updates
- [ ] View users who liked a post
- [ ] Test like without authentication (should fail)

### Comment Functionality
- [ ] Add comment to post
- [ ] View comments on post
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] Reply to comment
- [ ] View comment replies

### Error Handling
- [ ] Test with invalid post ID
- [ ] Test with expired authentication token
- [ ] Test with insufficient permissions
- [ ] Test server errors (database down, etc.)

## Performance Testing

### Load Testing with Artillery
Create `artillery-config.yml`:

```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer YOUR_TEST_TOKEN'

scenarios:
  - name: "Get posts feed"
    weight: 70
    flow:
      - get:
          url: "/api/posts?page=1&limit=10"
  
  - name: "Get single post"
    weight: 20
    flow:
      - get:
          url: "/api/posts/{{ $randomString() }}"
  
  - name: "Like post"
    weight: 10
    flow:
      - post:
          url: "/api/posts/{{ $randomString() }}/likes"
```

Run with: `artillery run artillery-config.yml`

## Security Testing

### Authentication Tests
- [ ] Access protected endpoints without token
- [ ] Access with expired token
- [ ] Access with invalid token
- [ ] Test token refresh functionality

### Authorization Tests
- [ ] Edit other user's post
- [ ] Delete other user's post
- [ ] View private posts of other users

### Input Validation Tests
- [ ] SQL injection attempts in captions/comments
- [ ] XSS attempts in text fields
- [ ] File upload security (malicious files)
- [ ] Large payload attacks

## Monitoring and Logging

### Key Metrics to Monitor
- Post creation success rate
- Image upload performance
- API response times
- Error rates by endpoint
- User engagement (likes, comments)

### Log Analysis
Check logs for:
- Failed image uploads
- Database connection errors
- Authentication failures
- Performance bottlenecks

This comprehensive testing approach ensures your 360-degree post system is robust, secure, and performs well under various conditions.
