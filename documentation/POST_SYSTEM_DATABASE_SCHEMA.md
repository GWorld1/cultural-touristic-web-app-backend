# Post System Database Schema Design

## Appwrite Collections Structure

### 1. Posts Collection (`posts`)

```typescript
interface Post {
  $id: string;                    // Unique post identifier (auto-generated)
  $createdAt: string;             // ISO timestamp (auto-generated)
  $updatedAt: string;             // ISO timestamp (auto-generated)
  
  // Core post data
  authorId: string;               // User ID who created the post
  caption: string;                // Post description/caption (max: 2000 chars)
  imageUrl: string;               // Cloudinary URL for 360-degree image
  imagePublicId: string;          // Cloudinary public ID for image management
  
  // Location data
  location?: {
    name: string;                 // Location name (e.g., "Eiffel Tower")
    latitude?: number;            // GPS latitude
    longitude?: number;           // GPS longitude
    address?: string;             // Full address
    city?: string;                // City name
    country?: string;             // Country name
  };
  
  // Metadata
  tags: string[];                 // Array of hashtags/tags
  isPublic: boolean;              // Public/private visibility
  status: 'draft' | 'published' | 'archived'; // Post status
  
  // Engagement metrics
  likesCount: number;             // Total likes count
  commentsCount: number;          // Total comments count
  viewsCount: number;             // Total views count
  
  // Image metadata
  imageMetadata: {
    width: number;                // Image width
    height: number;               // Image height
    format: string;               // Image format (jpg, png)
    size: number;                 // File size in bytes
    isEquirectangular: boolean;   // Confirms 360-degree format
  };
}
```

**Appwrite Collection Attributes:**
- `authorId` - String, Required, Index
- `caption` - String, Required, Max: 2000
- `imageUrl` - URL, Required
- `imagePublicId` - String, Required
- `location` - JSON, Optional
- `tags` - Array, Optional
- `isPublic` - Boolean, Required, Default: true
- `status` - Enum ['draft', 'published', 'archived'], Default: 'published'
- `likesCount` - Integer, Default: 0
- `commentsCount` - Integer, Default: 0
- `viewsCount` - Integer, Default: 0
- `imageMetadata` - JSON, Required

### 2. Likes Collection (`post_likes`)

```typescript
interface PostLike {
  $id: string;                    // Unique like identifier
  $createdAt: string;             // When like was created
  
  postId: string;                 // Reference to post
  userId: string;                 // User who liked the post
}
```

**Appwrite Collection Attributes:**
- `postId` - String, Required, Index
- `userId` - String, Required, Index
- **Unique Index**: Combination of `postId` + `userId` (prevents duplicate likes)

### 3. Comments Collection (`post_comments`)

```typescript
interface PostComment {
  $id: string;                    // Unique comment identifier
  $createdAt: string;             // When comment was created
  $updatedAt: string;             // When comment was last updated
  
  postId: string;                 // Reference to post
  authorId: string;               // User who wrote the comment
  content: string;                // Comment text content
  isEdited: boolean;              // Whether comment was edited
  
  // Optional: Reply functionality
  parentCommentId?: string;       // For nested replies
  repliesCount: number;           // Number of replies to this comment
}
```

**Appwrite Collection Attributes:**
- `postId` - String, Required, Index
- `authorId` - String, Required, Index
- `content` - String, Required, Max: 1000
- `isEdited` - Boolean, Default: false
- `parentCommentId` - String, Optional, Index
- `repliesCount` - Integer, Default: 0

## Database Relationships

### Primary Relationships:
1. **User → Posts**: One-to-Many (User can have multiple posts)
2. **Post → Likes**: One-to-Many (Post can have multiple likes)
3. **Post → Comments**: One-to-Many (Post can have multiple comments)
4. **User → Likes**: One-to-Many (User can like multiple posts)
5. **User → Comments**: One-to-Many (User can comment on multiple posts)
6. **Comment → Replies**: One-to-Many (Comment can have multiple replies)

### Indexes for Performance:
- `posts.authorId` - For user's posts queries
- `posts.isPublic` - For public posts filtering
- `posts.status` - For published posts filtering
- `posts.$createdAt` - For chronological sorting
- `post_likes.postId` - For post likes queries
- `post_likes.userId` - For user likes queries
- `post_comments.postId` - For post comments queries
- `post_comments.authorId` - For user comments queries

## Query Patterns

### Common Queries:
1. **Get Public Posts (Feed)**:
   ```javascript
   Query.equal('isPublic', true),
   Query.equal('status', 'published'),
   Query.orderDesc('$createdAt'),
   Query.limit(20)
   ```

2. **Get User's Posts**:
   ```javascript
   Query.equal('authorId', userId),
   Query.orderDesc('$createdAt')
   ```

3. **Get Post Likes**:
   ```javascript
   Query.equal('postId', postId)
   ```

4. **Check if User Liked Post**:
   ```javascript
   Query.equal('postId', postId),
   Query.equal('userId', userId)
   ```

5. **Get Post Comments**:
   ```javascript
   Query.equal('postId', postId),
   Query.isNull('parentCommentId'), // Top-level comments only
   Query.orderAsc('$createdAt')
   ```

## Data Validation Rules

### Post Validation:
- Caption: 1-2000 characters
- Image: Required, must be valid 360-degree format
- Tags: Maximum 10 tags, each 1-50 characters
- Location: Optional, valid coordinates if provided

### Comment Validation:
- Content: 1-1000 characters
- No HTML tags allowed (prevent XSS)
- Rate limiting: Max 10 comments per minute per user

### Like Validation:
- One like per user per post
- Cannot like own posts (optional business rule)
- Rate limiting: Max 100 likes per minute per user

## Storage Considerations

### Cloudinary Organization:
```
posts/
├── user_123456/
│   ├── post_abc123.jpg
│   ├── post_def456.jpg
│   └── ...
├── user_789012/
│   ├── post_ghi789.jpg
│   └── ...
```

### Image Transformations:
- **Thumbnail**: `w_400,h_200,c_fill`
- **Medium**: `w_800,h_400,c_fill`
- **Full**: `w_2048,h_1024,c_limit`
- **Optimized**: `f_auto,q_auto`
