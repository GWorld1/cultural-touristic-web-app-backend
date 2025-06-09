# Tour Service API Documentation

## Overview

The Tour Service provides a comprehensive API for managing virtual cultural tours, consisting of three main entities:
- **Tours**: Main tour containers with metadata and settings
- **Scenes**: Individual panoramic views within a tour
- **Hotspots**: Interactive points within scenes

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Authentication Method
The API uses JWT (JSON Web Token) based authentication with Bearer tokens.

### Headers Required for Protected Endpoints
```http
Authorization: Bearer <your_jwt_token>
```

### Authentication Flow
1. Authenticate via `/api/auth/login` to receive a JWT token
2. Include the token in the Authorization header for protected endpoints
3. Tokens contain user ID, email, and role information

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation details
}
```

## HTTP Status Codes

- `200` - OK (successful GET, PUT)
- `201` - Created (successful POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

# Tour Endpoints

## 1. Get All Tours

**GET** `/tours`

Retrieve a paginated list of tours with optional filtering.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1, min: 1) |
| limit | integer | No | Items per page (default: 10, min: 1, max: 100) |
| category | string | No | Filter by category |
| search | string | No | Search in title and description |
| isPublic | boolean | No | Filter by public/private status |
| tags | string | No | Filter by tags (JSON array or comma-separated) |
| authorId | string | No | Filter by author ID |

### Example Request
```http
GET /api/tours?page=1&limit=10&isPublic=true&search=cultural
```

### Example Response
```json
{
  "success": true,
  "data": {
    "tours": [
      {
        "$id": "tour_123",
        "title": "Cultural Heritage Tour",
        "description": "Explore ancient artifacts...",
        "author": "John Doe",
        "authorId": "user_456",
        "tags": ["culture", "history"],
        "isPublic": true,
        "category": "museum",
        "status": "published",
        "viewCount": 150,
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "settings": {
          "autoRotate": false,
          "showControls": true
        },
        "$createdAt": "2024-01-15T10:30:00.000Z",
        "$updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

## 2. Get Tour by ID

**GET** `/tours/{id}`

Retrieve a single tour with all its scenes and hotspots.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Tour ID |

### Example Request
```http
GET /api/tours/tour_123
```

### Example Response
```json
{
  "success": true,
  "data": {
    "tour": {
      "$id": "tour_123",
      "title": "Cultural Heritage Tour",
      "description": "Explore ancient artifacts...",
      "author": "John Doe",
      "authorId": "user_456",
      "settings": {
        "autoRotate": false,
        "autoRotateSpeed": 2,
        "showControls": true,
        "allowFullscreen": true,
        "showSceneList": true,
        "backgroundColor": "#000000",
        "loadingScreenText": "Loading virtual tour..."
      },
      "scenes": [
        {
          "$id": "scene_789",
          "title": "Entrance Hall",
          "description": "Welcome area",
          "order": 1,
          "imageUrl": "https://res.cloudinary.com/...",
          "pitch": 0,
          "yaw": 0,
          "hfov": 100,
          "hotspots": [
            {
              "$id": "hotspot_101",
              "text": "Information Desk",
              "type": "info",
              "pitch": 10,
              "yaw": 45,
              "infoContent": {
                "title": "Welcome",
                "description": "Get your tickets here"
              },
              "style": {
                "backgroundColor": "#ffffff",
                "textColor": "#000000"
              }
            }
          ]
        }
      ]
    }
  }
}
```

## 3. Create Tour

**POST** `/tours`

Create a new tour with optional thumbnail upload.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | max: 255 chars | Tour title |
| description | string | Yes | max: 2000 chars | Tour description |
| author | string | Yes | - | Author name |
| estimatedDuration | integer | No | min: 1 | Duration in minutes |
| isPublic | boolean | No | - | Public visibility |
| thumbnail | file | No | Image only, max: 10MB | Tour thumbnail |

### Example Request
```http
POST /api/tours
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=Amazing Cultural Tour
description=Explore the rich cultural heritage...
author=John Doe
isPublic=true
estimatedDuration=30
thumbnail=<image_file>
```

### Example Response
```json
{
  "success": true,
  "data": {
    "tour": {
      "$id": "tour_new_123",
      "title": "Amazing Cultural Tour",
      "description": "Explore the rich cultural heritage...",
      "author": "John Doe",
      "authorId": "user_456",
      "isPublic": true,
      "status": "draft",
      "viewCount": 0,
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "settings": {
        "autoRotate": false,
        "autoRotateSpeed": 2,
        "showControls": true,
        "allowFullscreen": true,
        "showSceneList": true,
        "backgroundColor": "#000000",
        "loadingScreenText": "Loading virtual tour..."
      },
      "scenes": [],
      "$createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 4. Create Tour (Test - JSON Only)

**POST** `/tours/test`

Create a tour using JSON payload (for testing purposes).

### Authentication
🔒 **Required** - Bearer token

### Content Type
`application/json`

### Request Body
```json
{
  "title": "Test Tour",
  "description": "A test tour description",
  "metadata": {
    "author": "John Doe",
    "estimatedDuration": 30,
    "isPublic": true,
    "tags": ["test", "demo"]
  }
}
```

## 5. Update Tour

**PUT** `/tours/{id}`

Update an existing tour. Only the tour owner can update.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Tour ID |

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | No | max: 255 chars | Tour title |
| description | string | No | max: 2000 chars | Tour description |
| thumbnail | file | No | Image only, max: 10MB | New thumbnail |

### Example Response
```json
{
  "success": true,
  "data": {
    "tour": {
      "$id": "tour_123",
      "title": "Updated Tour Title",
      // ... other tour fields
    }
  }
}
```

## 6. Delete Tour

**DELETE** `/tours/{id}`

Delete a tour and all associated scenes and hotspots. Only the tour owner can delete.

### Authentication
🔒 **Required** - Bearer token

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Tour ID |

### Example Response
```json
{
  "success": true,
  "data": {
    "message": "Tour deleted successfully"
  }
}
```

## 7. Publish Tour

**PUT** `/tours/{id}/publish`

Publish a tour to make it publicly visible.

### Authentication
🔒 **Required** - Bearer token

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Tour ID |

### Example Response
```json
{
  "success": true,
  "data": {
    "tour": {
      "$id": "tour_123",
      "status": "published",
      "isPublic": true
      // ... other tour fields
    }
  }
}
```

## 8. Unpublish Tour

**PUT** `/tours/{id}/unpublish`

Unpublish a tour to make it private.

### Authentication
🔒 **Required** - Bearer token

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Tour ID |

### Example Response
```json
{
  "success": true,
  "data": {
    "tour": {
      "$id": "tour_123",
      "status": "draft",
      "isPublic": false
      // ... other tour fields
    }
  }
}
```

---

# Scene Endpoints

## 1. Create Scene

**POST** `/scenes`

Create a new scene within a tour with optional panoramic image upload.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| tourId | string | Yes | - | Parent tour ID |
| title | string | Yes | max: 255 chars | Scene title |
| description | string | No | max: 1000 chars | Scene description |
| order | integer | No | - | Display order (default: 0) |
| panoramaUrl | string | No | - | External panorama URL |
| pitch | float | No | - | Initial pitch angle (default: 0) |
| yaw | float | No | - | Initial yaw angle (default: 0) |
| hfov | float | No | - | Horizontal field of view (default: 100) |
| image | file | No | Image only, max: 10MB | Panoramic image |

### Example Request
```http
POST /api/scenes
Authorization: Bearer <token>
Content-Type: multipart/form-data

tourId=tour_123
title=Entrance Hall
description=Welcome to the museum
order=1
pitch=0
yaw=0
hfov=100
image=<panorama_file>
```

### Example Response
```json
{
  "success": true,
  "data": {
    "scene": {
      "$id": "scene_789",
      "tourId": "tour_123",
      "title": "Entrance Hall",
      "description": "Welcome to the museum",
      "order": 1,
      "imageUrl": "https://res.cloudinary.com/...",
      "authorId": "user_456",
      "pitch": 0,
      "yaw": 0,
      "hfov": 100,
      "$createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 2. Get Scene by ID

**GET** `/scenes/{id}`

Retrieve a single scene by its ID.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Scene ID |

### Example Request
```http
GET /api/scenes/scene_789
```

### Example Response
```json
{
  "success": true,
  "data": {
    "scene": {
      "$id": "scene_789",
      "tourId": "tour_123",
      "title": "Entrance Hall",
      "description": "Welcome to the museum",
      "order": 1,
      "imageUrl": "https://res.cloudinary.com/...",
      "authorId": "user_456",
      "pitch": 0,
      "yaw": 0,
      "hfov": 100,
      "$createdAt": "2024-01-15T10:30:00.000Z",
      "$updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 3. Update Scene

**PUT** `/scenes/{id}`

Update an existing scene. Only the scene owner can update.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Scene ID |

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | No | max: 255 chars | Scene title |
| description | string | No | max: 1000 chars | Scene description |
| order | integer | No | - | Display order |
| panoramaUrl | string | No | - | External panorama URL |
| pitch | float | No | - | Initial pitch angle |
| yaw | float | No | - | Initial yaw angle |
| hfov | float | No | - | Horizontal field of view |
| image | file | No | Image only, max: 10MB | New panoramic image |

### Example Response
```json
{
  "success": true,
  "data": {
    "scene": {
      "$id": "scene_789",
      "title": "Updated Scene Title",
      // ... other scene fields
    }
  }
}
```

## 4. Delete Scene

**DELETE** `/scenes/{id}`

Delete a scene and all its associated hotspots. Only the scene owner can delete.

### Authentication
🔒 **Required** - Bearer token

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Scene ID |

### Example Response
```json
{
  "success": true,
  "data": {
    "message": "Scene deleted successfully"
  }
}
```

---

# Hotspot Endpoints

## 1. Create Hotspot

**POST** `/hotspots`

Create a new interactive hotspot within a scene.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| sceneId | string | Yes | - | Parent scene ID |
| tourId | string | Yes | - | Parent tour ID |
| text | string | Yes | max: 255 chars | Hotspot display text |
| type | string | Yes | 'info' or 'link' | Hotspot type |
| pitch | float | No | - | Vertical position angle |
| yaw | float | No | - | Horizontal position angle |
| infoContent | object | No | - | Content for info hotspots (JSON) |
| externalUrl | string | No | Valid URL | URL for link hotspots |
| style | object | No | - | Custom styling (JSON) |
| image | file | No | Image only, max: 10MB | Hotspot icon image |

### Example Request
```http
POST /api/hotspots
Authorization: Bearer <token>
Content-Type: multipart/form-data

sceneId=scene_789
tourId=tour_123
text=Information Point
type=info
pitch=10
yaw=45
infoContent={"title":"Historical Artifact","description":"This artifact dates back to..."}
style={"backgroundColor":"#ffffff","textColor":"#000000"}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "hotspot": {
      "$id": "hotspot_101",
      "sceneId": "scene_789",
      "tourId": "tour_123",
      "text": "Information Point",
      "type": "info",
      "pitch": 10,
      "yaw": 45,
      "infoContent": {
        "title": "Historical Artifact",
        "description": "This artifact dates back to..."
      },
      "externalUrl": "",
      "style": {
        "backgroundColor": "#ffffff",
        "textColor": "#000000",
        "borderColor": "#cccccc",
        "borderWidth": 1,
        "borderRadius": 5,
        "padding": 10
      },
      "authorId": "user_456",
      "$createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 2. Get Hotspot by ID

**GET** `/hotspots/{id}`

Retrieve a single hotspot by its ID.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Hotspot ID |

### Example Request
```http
GET /api/hotspots/hotspot_101
```

### Example Response
```json
{
  "success": true,
  "data": {
    "hotspot": {
      "$id": "hotspot_101",
      "sceneId": "scene_789",
      "tourId": "tour_123",
      "text": "Information Point",
      "type": "info",
      "pitch": 10,
      "yaw": 45,
      "infoContent": {
        "title": "Historical Artifact",
        "description": "This artifact dates back to..."
      },
      "style": {
        "backgroundColor": "#ffffff",
        "textColor": "#000000"
      },
      "authorId": "user_456",
      "$createdAt": "2024-01-15T10:30:00.000Z",
      "$updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 3. Update Hotspot

**PUT** `/hotspots/{id}`

Update an existing hotspot. Only the hotspot owner can update.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Hotspot ID |

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| text | string | No | max: 255 chars | Hotspot display text |
| type | string | No | 'info' or 'link' | Hotspot type |
| pitch | float | No | - | Vertical position angle |
| yaw | float | No | - | Horizontal position angle |
| infoContent | object | No | - | Content for info hotspots (JSON) |
| externalUrl | string | No | Valid URL | URL for link hotspots |
| style | object | No | - | Custom styling (JSON) |
| image | file | No | Image only, max: 10MB | New hotspot icon image |

### Example Response
```json
{
  "success": true,
  "data": {
    "hotspot": {
      "$id": "hotspot_101",
      "text": "Updated Information Point",
      // ... other hotspot fields
    }
  }
}
```

## 4. Delete Hotspot

**DELETE** `/hotspots/{id}`

Delete a hotspot. Only the hotspot owner can delete.

### Authentication
🔒 **Required** - Bearer token

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Hotspot ID |

### Example Response
```json
{
  "success": true,
  "data": {
    "message": "Hotspot deleted successfully"
  }
}
```

---

# Image Management Endpoints

## 1. Upload Image

**POST** `/images/upload`

Upload an image to Cloudinary with organized folder structure.

### Authentication
🔒 **Required** - Bearer token

### Content Type
`multipart/form-data`

### Request Body
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| image | file | Yes | Image only, max: 10MB | Image file to upload |
| resourceType | string | Yes | 'tour', 'scene', or 'hotspot' | Resource type for organization |

### Example Request
```http
POST /api/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

image=<image_file>
resourceType=tour
```

### Example Response
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/tour/user_456/image.jpg",
    "publicId": "tour/user_456/image",
    "resourceType": "tour",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 245760
  }
}
```

## 2. List Images

**GET** `/images`

List uploaded images by resource type and user.

### Authentication
🔒 **Required** - Bearer token

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| resourceType | string | No | Filter by 'tour', 'scene', or 'hotspot' |
| limit | integer | No | Items per page (default: 50, max: 100) |

### Example Request
```http
GET /api/images?resourceType=tour&limit=20
Authorization: Bearer <token>
```

---

# Data Models

## Tour Model

```typescript
interface Tour {
  $id: string;                    // Unique tour identifier
  title: string;                  // Tour title (max: 255 chars)
  description: string;            // Tour description (max: 2000 chars)
  author: string;                 // Author name
  authorId: string;               // Author user ID
  tags: string[];                 // Array of tags
  isPublic: boolean;              // Public visibility
  category: string;               // Tour category
  status: 'draft' | 'published'; // Publication status
  viewCount: number;              // View counter
  thumbnailUrl: string;           // Thumbnail image URL
  settings: TourSettings;         // Tour configuration
  startSceneId: string;           // ID of starting scene
  $createdAt: string;             // ISO timestamp
  $updatedAt: string;             // ISO timestamp
}

interface TourSettings {
  autoRotate: boolean;            // Auto-rotation enabled
  autoRotateSpeed: number;        // Rotation speed (1-10)
  showControls: boolean;          // Show navigation controls
  allowFullscreen: boolean;       // Allow fullscreen mode
  showSceneList: boolean;         // Show scene navigation
  backgroundColor: string;        // Background color (hex)
  loadingScreenText: string;      // Loading message
}
```

## Scene Model

```typescript
interface Scene {
  $id: string;                    // Unique scene identifier
  tourId: string;                 // Parent tour ID
  title: string;                  // Scene title (max: 255 chars)
  description: string;            // Scene description (max: 1000 chars)
  order: number;                  // Display order
  imageUrl: string;               // Panoramic image URL
  authorId: string;               // Author user ID
  pitch: number;                  // Initial pitch angle (-90 to 90)
  yaw: number;                    // Initial yaw angle (-180 to 180)
  hfov: number;                   // Horizontal field of view (30-120)
  $createdAt: string;             // ISO timestamp
  $updatedAt: string;             // ISO timestamp
}
```

## Hotspot Model

```typescript
interface Hotspot {
  $id: string;                    // Unique hotspot identifier
  sceneId: string;                // Parent scene ID
  tourId: string;                 // Parent tour ID
  text: string;                   // Display text (max: 255 chars)
  type: 'info' | 'link';          // Hotspot type
  pitch: number;                  // Vertical position angle
  yaw: number;                    // Horizontal position angle
  infoContent: InfoContent | null; // Content for info hotspots
  externalUrl: string;            // URL for link hotspots
  style: HotspotStyle;            // Visual styling
  authorId: string;               // Author user ID
  $createdAt: string;             // ISO timestamp
  $updatedAt: string;             // ISO timestamp
}

interface InfoContent {
  title: string;                  // Info title
  description: string;            // Info description
  facts?: string[];               // Optional facts array
  [key: string]: any;             // Additional custom fields
}

interface HotspotStyle {
  backgroundColor: string;        // Background color (hex)
  textColor: string;              // Text color (hex)
  borderColor: string;            // Border color (hex)
  borderWidth: number;            // Border width (px)
  borderRadius: number;           // Border radius (px)
  padding: number;                // Padding (px)
  [key: string]: any;             // Additional style properties
}
```

---

# Error Handling

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "value": "",
      "msg": "Title is required",
      "path": "title",
      "location": "body"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Not authorized, token failed"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "Unauthorized: You can only update your own tours"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Tour not found"
}
```

### File Upload Error (400)
```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB."
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## File Upload Constraints

- **Maximum file size**: 10MB
- **Allowed file types**: Images only (JPEG, PNG, GIF, WebP)
- **Maximum files per request**: 5 files
- **Supported fields**: `thumbnail`, `image`

---

# Usage Examples

## Complete Workflow: Creating a Tour with Scenes and Hotspots

### Step 1: Create a Tour
```javascript
const formData = new FormData();
formData.append('title', 'Museum Virtual Tour');
formData.append('description', 'Explore our cultural heritage collection');
formData.append('author', 'Museum Curator');
formData.append('isPublic', 'true');
formData.append('thumbnail', thumbnailFile);

const tourResponse = await fetch('/api/tours', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data: tourData } = await tourResponse.json();
const tourId = tourData.tour.$id;
```

### Step 2: Create Scenes
```javascript
// Create first scene
const scene1FormData = new FormData();
scene1FormData.append('tourId', tourId);
scene1FormData.append('title', 'Entrance Hall');
scene1FormData.append('description', 'Welcome to the museum');
scene1FormData.append('order', '1');
scene1FormData.append('image', entrancePanorama);

const scene1Response = await fetch('/api/scenes', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: scene1FormData
});

const { data: scene1Data } = await scene1Response.json();
const scene1Id = scene1Data.scene.$id;

// Create second scene
const scene2FormData = new FormData();
scene2FormData.append('tourId', tourId);
scene2FormData.append('title', 'Main Gallery');
scene2FormData.append('description', 'Ancient artifacts collection');
scene2FormData.append('order', '2');
scene2FormData.append('image', galleryPanorama);

const scene2Response = await fetch('/api/scenes', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: scene2FormData
});
```

### Step 3: Add Hotspots
```javascript
// Add info hotspot to first scene
const hotspot1FormData = new FormData();
hotspot1FormData.append('sceneId', scene1Id);
hotspot1FormData.append('tourId', tourId);
hotspot1FormData.append('text', 'Information Desk');
hotspot1FormData.append('type', 'info');
hotspot1FormData.append('pitch', '10');
hotspot1FormData.append('yaw', '45');
hotspot1FormData.append('infoContent', JSON.stringify({
  title: 'Welcome',
  description: 'Get your tickets and maps here',
  facts: ['Open daily 9-5', 'Free admission on Sundays']
}));

const hotspot1Response = await fetch('/api/hotspots', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: hotspot1FormData
});

// Add link hotspot to navigate to next scene
const hotspot2FormData = new FormData();
hotspot2FormData.append('sceneId', scene1Id);
hotspot2FormData.append('tourId', tourId);
hotspot2FormData.append('text', 'Go to Main Gallery');
hotspot2FormData.append('type', 'link');
hotspot2FormData.append('pitch', '0');
hotspot2FormData.append('yaw', '90');
hotspot2FormData.append('externalUrl', `/scenes/${scene2Id}`);

const hotspot2Response = await fetch('/api/hotspots', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: hotspot2FormData
});
```

### Step 4: Publish the Tour
```javascript
const publishResponse = await fetch(`/api/tours/${tourId}/publish`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: publishedTour } = await publishResponse.json();
console.log('Tour published:', publishedTour.tour.status);
```

## Fetching and Displaying a Complete Tour

```javascript
// Fetch complete tour with all scenes and hotspots
const tourResponse = await fetch(`/api/tours/${tourId}`);
const { data: { tour } } = await tourResponse.json();

// Tour structure:
console.log('Tour:', tour.title);
console.log('Settings:', tour.settings);

tour.scenes.forEach((scene, index) => {
  console.log(`Scene ${index + 1}:`, scene.title);
  console.log('Panorama URL:', scene.imageUrl);

  scene.hotspots.forEach((hotspot, hotspotIndex) => {
    console.log(`  Hotspot ${hotspotIndex + 1}:`, hotspot.text);
    console.log('  Type:', hotspot.type);
    console.log('  Position:', { pitch: hotspot.pitch, yaw: hotspot.yaw });

    if (hotspot.type === 'info' && hotspot.infoContent) {
      console.log('  Info:', hotspot.infoContent);
    }

    if (hotspot.type === 'link' && hotspot.externalUrl) {
      console.log('  Link:', hotspot.externalUrl);
    }
  });
});
```

---

# Validation Rules

## Tour Validation
- **title**: Required, string, max 255 characters
- **description**: Required, string, max 2000 characters
- **author**: Required, string
- **estimatedDuration**: Optional, integer, min 1
- **isPublic**: Optional, boolean
- **thumbnail**: Optional, image file, max 10MB

## Scene Validation
- **tourId**: Required, string, must be valid tour ID
- **title**: Required, string, max 255 characters
- **description**: Optional, string, max 1000 characters
- **order**: Optional, integer
- **panoramaUrl**: Optional, string
- **pitch**: Optional, float
- **yaw**: Optional, float
- **hfov**: Optional, float
- **image**: Optional, image file, max 10MB

## Hotspot Validation
- **sceneId**: Required, string, must be valid scene ID
- **tourId**: Required, string, must be valid tour ID
- **text**: Required, string, max 255 characters
- **type**: Required, string, must be 'info' or 'link'
- **pitch**: Optional, float
- **yaw**: Optional, float
- **infoContent**: Optional, valid JSON object
- **externalUrl**: Optional, valid URL format
- **style**: Optional, valid JSON object
- **image**: Optional, image file, max 10MB

## Authorization Rules
- **Tours**: Only tour owners can update, delete, publish, or unpublish
- **Scenes**: Only scene owners can update or delete
- **Hotspots**: Only hotspot owners can update or delete
- **Cross-ownership**: Users can only add scenes to their own tours
- **Cross-ownership**: Users can only add hotspots to their own scenes

---

# Rate Limiting and Performance

## Recommendations
- Implement rate limiting for file uploads (e.g., 10 uploads per minute per user)
- Use pagination for large result sets
- Cache frequently accessed public tours
- Optimize image sizes before upload
- Use CDN for serving images (Cloudinary provides this)

## Best Practices
- Always validate file types and sizes on the client side
- Compress images before upload when possible
- Use appropriate image formats (WebP for modern browsers)
- Implement proper error handling for network failures
- Use loading states during file uploads

---

*This documentation covers the complete Tour Service API as of January 2024. For the most up-to-date information, please refer to the source code and any additional API changes.*
