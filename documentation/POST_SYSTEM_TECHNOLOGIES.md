# Post System Technologies and Libraries

## Backend Technologies (Already Available)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Appwrite** - Backend-as-a-Service for database operations
- **Cloudinary** - Image storage and processing
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Express-validator** - Input validation

## Frontend Technologies (Recommended)
### 360-Degree Image Viewing Libraries
1. **A-Frame** (Recommended)
   - Web framework for building virtual reality experiences
   - Excellent 360-degree image support
   - Easy integration with web applications
   - CDN: `https://aframe.io/releases/1.4.0/aframe.min.js`

2. **Three.js** (Alternative)
   - 3D graphics library
   - More complex but highly customizable
   - Better performance for complex scenes

3. **Pannellum** (Lightweight Alternative)
   - Lightweight panorama viewer
   - Pure JavaScript, no dependencies
   - Good for simple 360-degree viewing

### UI/UX Libraries
- **React** or **Vue.js** - Frontend framework
- **Bootstrap** or **Tailwind CSS** - Styling
- **Font Awesome** - Icons for like/comment buttons

## Database Schema Requirements

### New Collections Needed in Appwrite:
1. **Posts Collection** - Store post metadata
2. **Likes Collection** - Store user likes on posts
3. **Comments Collection** - Store user comments on posts

## Image Processing Requirements

### Cloudinary Features to Use:
- **Folder Organization**: `posts/user_id/image.jpg`
- **Image Optimization**: Automatic format conversion and compression
- **Responsive Images**: Multiple sizes for different devices
- **360-Degree Image Support**: Cloudinary supports panoramic images

## API Endpoints Structure

### Posts API (`/api/posts`)
- `POST /` - Create new post
- `GET /` - Get all posts (with pagination)
- `GET /:id` - Get single post
- `PUT /:id` - Update post
- `DELETE /:id` - Delete post
- `GET /user/:userId` - Get posts by user

### Likes API (`/api/posts/:postId/likes`)
- `POST /` - Like/unlike post
- `GET /` - Get post likes

### Comments API (`/api/posts/:postId/comments`)
- `POST /` - Add comment
- `GET /` - Get post comments
- `PUT /:commentId` - Update comment
- `DELETE /:commentId` - Delete comment

## Security Considerations
- **Authentication**: JWT tokens for protected routes
- **Authorization**: Users can only edit/delete their own posts
- **File Validation**: Ensure only valid 360-degree images
- **Rate Limiting**: Prevent spam posting/commenting
- **Input Sanitization**: Prevent XSS attacks in captions/comments

## Performance Optimizations
- **Image Compression**: Cloudinary automatic optimization
- **Pagination**: Limit posts per request
- **Caching**: Cache frequently accessed posts
- **Lazy Loading**: Load images as needed
- **CDN**: Use Cloudinary's global CDN

## 360-Degree Image Requirements
- **Supported Formats**: JPEG, PNG
- **Aspect Ratio**: 2:1 (equirectangular projection)
- **Resolution**: Minimum 2048x1024, recommended 4096x2048
- **File Size**: Maximum 10MB (configurable)

## Frontend Integration Example (A-Frame)
```html
<a-scene embedded style="height: 400px; width: 100%;">
  <a-sky src="panoramic-image-url" rotation="0 -130 0"></a-sky>
  <a-camera>
    <a-cursor color="raycast"></a-cursor>
  </a-camera>
</a-scene>
```

## Mobile Considerations
- **Touch Controls**: Swipe to navigate 360-degree view
- **Gyroscope**: Use device orientation for immersive experience
- **Performance**: Optimize for mobile devices
- **Responsive Design**: Adapt to different screen sizes
