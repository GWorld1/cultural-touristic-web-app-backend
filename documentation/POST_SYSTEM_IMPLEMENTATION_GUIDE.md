# Post System Implementation Guide

## Phase 1: Database Setup (Appwrite Collections)

### Step 1.1: Create Collections in Appwrite Console

#### Posts Collection
1. **Collection ID**: `posts`
2. **Attributes**:
   ```
   authorId        - String, Required, Size: 255, Index: true
   caption         - String, Required, Size: 2000
   imageUrl        - URL, Required, Size: 500
   imagePublicId   - String, Required, Size: 255
   location        - JSON, Optional, Size: 1000
   tags            - Array, Optional
   isPublic        - Boolean, Required, Default: true
   status          - Enum ['draft', 'published', 'archived'], Default: 'published'
   likesCount      - Integer, Default: 0
   commentsCount   - Integer, Default: 0
   viewsCount      - Integer, Default: 0
   imageMetadata   - JSON, Required, Size: 1000
   ```

#### Post Likes Collection
1. **Collection ID**: `post_likes`
2. **Attributes**:
   ```
   postId    - String, Required, Size: 255, Index: true
   userId    - String, Required, Size: 255, Index: true
   ```
3. **Unique Index**: `postId_userId` (combination of postId + userId)

#### Post Comments Collection
1. **Collection ID**: `post_comments`
2. **Attributes**:
   ```
   postId           - String, Required, Size: 255, Index: true
   authorId         - String, Required, Size: 255, Index: true
   content          - String, Required, Size: 1000
   isEdited         - Boolean, Default: false
   parentCommentId  - String, Optional, Size: 255, Index: true
   repliesCount     - Integer, Default: 0
   ```

### Step 1.2: Update Environment Variables
Add to `.env` file:
```env
APPWRITE_POSTS_COLLECTION_ID=posts
APPWRITE_POST_LIKES_COLLECTION_ID=post_likes
APPWRITE_POST_COMMENTS_COLLECTION_ID=post_comments
```

## Phase 2: Backend Implementation

### Step 2.1: Create Configuration Files

#### `config/collections.js`
```javascript
const COLLECTIONS = {
  // Existing
  USERS: process.env.APPWRITE_USERS_COLLECTION_ID,
  TOURS: '68438aa8003143e4d330',
  SCENES: '68438e900010d9797e48',
  HOTSPOTS: '684390750026a2e5e2b8',
  
  // New post system
  POSTS: process.env.APPWRITE_POSTS_COLLECTION_ID,
  POST_LIKES: process.env.APPWRITE_POST_LIKES_COLLECTION_ID,
  POST_COMMENTS: process.env.APPWRITE_POST_COMMENTS_COLLECTION_ID
};

module.exports = COLLECTIONS;
```

### Step 2.2: Create Services

#### `services/panorama.service.js`
```javascript
class PanoramaService {
  static validatePanoramicImage(file) {
    // Validate 360-degree image format
    // Check aspect ratio (should be 2:1)
    // Validate file size and format
  }
  
  static async processImage(fileBuffer, userId, originalName) {
    // Upload to Cloudinary with specific transformations
    // Return optimized URLs for different sizes
  }
}
```

#### `services/post.service.js`
```javascript
class PostService {
  static async createPost(postData, userId) { }
  static async getPostsFeed(page, limit, userId) { }
  static async getPostById(postId, userId) { }
  static async updatePost(postId, updateData, userId) { }
  static async deletePost(postId, userId) { }
  static async getUserPosts(targetUserId, page, limit) { }
}
```

### Step 2.3: Create Controllers

#### `controllers/post.controller.js`
Following the pattern from `auth.controller.js`:
```javascript
const postController = {
  async createPost(req, res) {
    try {
      // Validate input
      // Process image upload
      // Create post in database
      // Return success response
    } catch (error) {
      // Handle errors consistently
    }
  },
  
  async getPostsFeed(req, res) { },
  async getPostById(req, res) { },
  async updatePost(req, res) { },
  async deletePost(req, res) { },
  async getUserPosts(req, res) { }
};
```

### Step 2.4: Create Routes

#### `routes/post.routes.js`
Following the pattern from `tour.routes.js`:
```javascript
const router = express.Router();

// Create post
router.post('/', [
  authMiddleware.protect,
  uploadSingle('image'),
  body('caption').isString().notEmpty().isLength({ max: 2000 }),
  body('location').optional().isJSON(),
  body('tags').optional().isArray({ max: 10 }),
  body('isPublic').optional().isBoolean(),
  handleValidationErrors
], postController.createPost);

// Get posts feed
router.get('/', [
  authMiddleware.optional,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('userId').optional().isString(),
  handleValidationErrors
], postController.getPostsFeed);
```

### Step 2.5: Update Server Configuration

#### `server.js`
Add new routes:
```javascript
const postRoutes = require('./routes/post.routes');
const likeRoutes = require('./routes/like.routes');
const commentRoutes = require('./routes/comment.routes');

app.use('/api/posts', postRoutes);
app.use('/api/posts', likeRoutes);
app.use('/api/posts', commentRoutes);
```

## Phase 3: API Endpoints Implementation

### Step 3.1: Post Management Endpoints

1. **POST /api/posts** - Create new post
2. **GET /api/posts** - Get posts feed
3. **GET /api/posts/:id** - Get single post
4. **PUT /api/posts/:id** - Update post
5. **DELETE /api/posts/:id** - Delete post
6. **GET /api/posts/user/:userId** - Get user's posts

### Step 3.2: Interaction Endpoints

1. **POST /api/posts/:postId/likes** - Toggle like
2. **GET /api/posts/:postId/likes** - Get post likes
3. **POST /api/posts/:postId/comments** - Add comment
4. **GET /api/posts/:postId/comments** - Get comments
5. **PUT /api/posts/:postId/comments/:commentId** - Update comment
6. **DELETE /api/posts/:postId/comments/:commentId** - Delete comment

## Phase 4: Frontend Integration

### Step 4.1: 360-Degree Viewer Implementation

#### Using A-Frame (Recommended)
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
</head>
<body>
  <div class="panorama-container">
    <a-scene embedded style="height: 400px; width: 100%;">
      <a-sky src="{{post.imageUrl}}" rotation="0 -130 0"></a-sky>
      <a-camera>
        <a-cursor color="raycast"></a-cursor>
      </a-camera>
    </a-scene>
  </div>
</body>
</html>
```

### Step 4.2: Post Feed Component
```javascript
// React component example
function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="post-feed">
      {posts.map(post => (
        <PostCard key={post.$id} post={post} />
      ))}
    </div>
  );
}
```

## Phase 5: Testing Strategy

### Step 5.1: Unit Tests
- Test post creation with valid/invalid data
- Test image upload and validation
- Test like/unlike functionality
- Test comment CRUD operations

### Step 5.2: Integration Tests
- Test complete post creation workflow
- Test post feed with pagination
- Test user authentication with post operations
- Test cascade delete operations

### Step 5.3: API Testing
```javascript
// Example test using Jest and Supertest
describe('POST /api/posts', () => {
  it('should create a new post with valid data', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', 'test-panorama.jpg')
      .field('caption', 'Test 360-degree post')
      .field('isPublic', 'true');
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.post).toBeDefined();
  });
});
```

## Phase 6: Deployment Considerations

### Step 6.1: Environment Setup
- Configure Cloudinary for production
- Set up Appwrite collections in production
- Configure proper CORS settings
- Set up SSL certificates

### Step 6.2: Performance Optimization
- Implement image lazy loading
- Add pagination to all list endpoints
- Configure Cloudinary CDN
- Add database indexes for performance

### Step 6.3: Monitoring
- Add logging for post operations
- Monitor image upload performance
- Track API response times
- Set up error alerting

## Implementation Timeline

**Week 1**: Database setup and basic post CRUD
**Week 2**: Like and comment functionality
**Week 3**: Frontend 360-degree viewer integration
**Week 4**: Testing and optimization
**Week 5**: Deployment and monitoring setup
