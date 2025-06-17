# Cloudinary Migration Guide

## Overview

This document outlines the migration from Appwrite storage to Cloudinary for image management in the Cultural Touristic Web Application. The migration implements an organized folder structure and provides comprehensive image handling capabilities.

## Migration Changes

### 1. Dependencies Added

```json
{
  "cloudinary": "^2.5.1",
  "express-fileupload": "^1.5.1"
}
```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Folder Structure

Images are organized in Cloudinary using the following structure:
- **Tours**: `tour/user_123456/image.jpg`
- **Scenes**: `scene/user_123456/image.jpg`
- **Hotspots**: `hotspot/user_123456/image.jpg`

## New Files Created

### Configuration
- `config/cloudinary.js` - Cloudinary configuration
- `services/cloudinary.service.js` - Cloudinary operations service
- `middleware/upload.js` - File upload middleware

### Routes
- `routes/scene.routes.js` - Scene management with image uploads
- `routes/hotspot.routes.js` - Hotspot management with image uploads

### Updated Files
- `routes/image.routes.js` - Migrated from Appwrite to Cloudinary
- `routes/tour.routes.js` - Added thumbnail upload functionality
- `server.js` - Added new routes and file upload middleware
- `package.json` - Added Cloudinary dependencies

## API Endpoints

### Image Management

#### Upload Image
```http
POST /api/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- image: File (required)
- resourceType: String (required) - "tour", "scene", or "hotspot"
```

#### List Images
```http
GET /api/images?resourceType=tour&limit=50
Authorization: Bearer <token>
```

#### Get Image Details
```http
GET /api/images/:publicId
Authorization: Bearer <token>
```

#### Delete Image
```http
DELETE /api/images/:publicId
Authorization: Bearer <token>
```

### Tour Management (Updated)

#### Create Tour with Thumbnail
```http
POST /api/tours
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title: String (required)
- description: String (required)
- metadata.author: String (required)
- metadata.estimatedDuration: Number (optional)
- metadata.isPublic: Boolean (optional)
- metadata.tags: Array (optional)
- thumbnail: File (optional)
```

#### Update Tour with Thumbnail
```http
PUT /api/tours/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title: String (optional)
- description: String (optional)
- thumbnail: File (optional)
```

### Scene Management (New)

#### Create Scene
```http
POST /api/scenes
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- tourId: String (required)
- title: String (required)
- description: String (optional)
- order: Number (optional)
- panoramaUrl: String (optional)
- image: File (optional)
```

#### Get Scene
```http
GET /api/scenes/:id
```

#### Update Scene
```http
PUT /api/scenes/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title: String (optional)
- description: String (optional)
- order: Number (optional)
- panoramaUrl: String (optional)
- image: File (optional)
```

#### Delete Scene
```http
DELETE /api/scenes/:id
Authorization: Bearer <token>
```

### Hotspot Management (New)

#### Create Hotspot
```http
POST /api/hotspots
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- sceneId: String (required)
- tourId: String (required)
- title: String (required)
- type: String (required) - "info", "link", "image", "video"
- position.x: Float (required) - between -1 and 1
- position.y: Float (required) - between -1 and 1
- position.z: Float (required) - between -1 and 1
- infoContent: Object (optional)
- linkUrl: String (optional)
- style: Object (optional)
- image: File (optional)
```

#### Get Hotspot
```http
GET /api/hotspots/:id
```

#### Update Hotspot
```http
PUT /api/hotspots/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title: String (optional)
- type: String (optional)
- position: Object (optional)
- infoContent: Object (optional)
- linkUrl: String (optional)
- style: Object (optional)
- image: File (optional)
```

#### Delete Hotspot
```http
DELETE /api/hotspots/:id
Authorization: Bearer <token>
```

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install cloudinary express-fileupload
   ```

2. **Configure Environment Variables**
   - Add Cloudinary credentials to `.env` file
   - Get credentials from your Cloudinary dashboard

3. **Start the Server**
   ```bash
   npm run dev
   ```

## Features

### Image Upload Features
- **Automatic Format Conversion**: All images converted to JPG for consistency
- **Quality Optimization**: Auto-optimized quality and format
- **File Size Limits**: 10MB maximum file size
- **Multiple File Support**: Up to 5 files per request
- **Image Validation**: Only image files allowed

### Security Features
- **User-based Folder Organization**: Images organized by user ID
- **Authentication Required**: All upload endpoints require authentication
- **Ownership Verification**: Users can only manage their own content
- **Input Validation**: Comprehensive validation for all endpoints

### Error Handling
- **Comprehensive Error Messages**: Detailed error responses
- **Upload Error Handling**: Specific handling for file upload errors
- **Validation Errors**: Clear validation error messages

## Migration Benefits

1. **Better Organization**: Structured folder hierarchy
2. **Improved Performance**: Cloudinary's CDN and optimization
3. **Scalability**: Cloud-based storage solution
4. **Image Transformations**: Built-in image processing capabilities
5. **Better Error Handling**: More robust error management
6. **Enhanced Security**: User-based access control

## Testing

Test the migration by:
1. Creating a tour with thumbnail upload
2. Creating scenes with panorama images
3. Creating hotspots with associated images
4. Verifying folder structure in Cloudinary dashboard
5. Testing image retrieval and deletion

## Troubleshooting

### Common Issues
1. **Missing Environment Variables**: Ensure all Cloudinary credentials are set
2. **File Size Errors**: Check file size limits (10MB max)
3. **Authentication Errors**: Verify JWT token is included in requests
4. **Upload Failures**: Check Cloudinary credentials and network connectivity
