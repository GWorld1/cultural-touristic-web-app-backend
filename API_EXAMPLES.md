# API Usage Examples

## Authentication

First, obtain a JWT token by logging in:

```javascript
// Login to get token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();
```

## Image Upload Examples

### 1. Upload Tour Thumbnail

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('resourceType', 'tour');

const response = await fetch('/api/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded image:', result.data.url);
```

### 2. Create Tour with Thumbnail

```javascript
const formData = new FormData();
formData.append('title', 'Amazing Cultural Tour');
formData.append('description', 'Explore the rich cultural heritage...');
formData.append('metadata.author', 'John Doe');
formData.append('metadata.isPublic', 'true');
formData.append('metadata.estimatedDuration', '30');
formData.append('thumbnail', thumbnailFile);

const response = await fetch('/api/tours', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 3. Create Scene with Panorama Image

```javascript
const formData = new FormData();
formData.append('tourId', 'tour_id_here');
formData.append('title', 'Main Entrance');
formData.append('description', 'The grand entrance of the museum');
formData.append('order', '1');
formData.append('image', panoramaFile);

const response = await fetch('/api/scenes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 4. Create Hotspot with Image

```javascript
const formData = new FormData();
formData.append('sceneId', 'scene_id_here');
formData.append('tourId', 'tour_id_here');
formData.append('title', 'Information Point');
formData.append('type', 'info');
formData.append('position.x', '0.5');
formData.append('position.y', '0.2');
formData.append('position.z', '0.8');
formData.append('infoContent', JSON.stringify({
  title: 'Historical Artifact',
  description: 'This artifact dates back to...',
  facts: ['Fact 1', 'Fact 2']
}));
formData.append('image', hotspotImage);

const response = await fetch('/api/hotspots', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Retrieve Images

### Get User's Images by Type

```javascript
// Get all tour images for the user
const response = await fetch('/api/images?resourceType=tour&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log('Tour images:', data.images);
```

### Get All User Images

```javascript
// Get images for all resource types
const response = await fetch('/api/images', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log('Tour images:', data.tour.images);
console.log('Scene images:', data.scene.images);
console.log('Hotspot images:', data.hotspot.images);
```

## Complete Tour Creation Workflow

```javascript
async function createCompleteVirtualTour() {
  try {
    // 1. Create tour with thumbnail
    const tourFormData = new FormData();
    tourFormData.append('title', 'Virtual Museum Tour');
    tourFormData.append('description', 'Explore our museum virtually');
    tourFormData.append('metadata.author', 'Museum Curator');
    tourFormData.append('metadata.isPublic', 'true');
    tourFormData.append('thumbnail', tourThumbnail);

    const tourResponse = await fetch('/api/tours', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: tourFormData
    });
    
    const { data: tourData } = await tourResponse.json();
    const tourId = tourData.tour.$id;

    // 2. Create first scene
    const sceneFormData = new FormData();
    sceneFormData.append('tourId', tourId);
    sceneFormData.append('title', 'Entrance Hall');
    sceneFormData.append('description', 'Welcome to the museum');
    sceneFormData.append('order', '1');
    sceneFormData.append('image', entrancePanorama);

    const sceneResponse = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: sceneFormData
    });
    
    const { data: sceneData } = await sceneResponse.json();
    const sceneId = sceneData.scene.$id;

    // 3. Add hotspot to scene
    const hotspotFormData = new FormData();
    hotspotFormData.append('sceneId', sceneId);
    hotspotFormData.append('tourId', tourId);
    hotspotFormData.append('title', 'Information Desk');
    hotspotFormData.append('type', 'info');
    hotspotFormData.append('position.x', '0.3');
    hotspotFormData.append('position.y', '0.1');
    hotspotFormData.append('position.z', '0.7');
    hotspotFormData.append('infoContent', JSON.stringify({
      title: 'Welcome',
      description: 'Get your tickets here'
    }));
    hotspotFormData.append('image', infoIcon);

    const hotspotResponse = await fetch('/api/hotspots', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: hotspotFormData
    });

    // 4. Publish the tour
    const publishResponse = await fetch(`/api/tours/${tourId}/publish`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Virtual tour created successfully!');
    
  } catch (error) {
    console.error('Error creating tour:', error);
  }
}
```

## Error Handling

```javascript
async function uploadImageWithErrorHandling(file, resourceType) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('resourceType', resourceType);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
    
  } catch (error) {
    if (error.message.includes('File too large')) {
      alert('File is too large. Maximum size is 10MB.');
    } else if (error.message.includes('Only image files')) {
      alert('Please select an image file.');
    } else {
      alert('Upload failed: ' + error.message);
    }
    throw error;
  }
}
```

## Image Transformations

The Cloudinary service automatically applies optimizations, but you can also request specific transformations:

```javascript
// The CloudinaryService.generateTransformationUrl method can be used
// to create optimized versions of uploaded images

// Example: Get a thumbnail version
const thumbnailUrl = CloudinaryService.generateTransformationUrl(
  publicId, 
  { 
    width: 300, 
    height: 200, 
    crop: 'fill',
    quality: 'auto:good'
  }
);

// Example: Get a blurred version for loading states
const blurredUrl = CloudinaryService.generateTransformationUrl(
  publicId,
  {
    effect: 'blur:300',
    quality: 'auto:low'
  }
);
```

## Frontend Integration Tips

1. **File Validation**: Always validate files on the frontend before upload
2. **Progress Tracking**: Use XMLHttpRequest for upload progress
3. **Image Preview**: Show preview before upload
4. **Error Handling**: Provide clear error messages to users
5. **Loading States**: Show loading indicators during uploads

```javascript
// Example file validation
function validateImageFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please select an image.');
  }
  
  return true;
}
```
