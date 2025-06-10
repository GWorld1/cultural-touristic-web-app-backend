# Post Search API Examples

This document provides practical examples of how to use the new post search endpoint.

## Endpoint Overview

**URL:** `GET /api/posts/search`  
**Authentication:** Optional  
**Purpose:** Search and filter posts by tags and location with sorting and pagination

## Basic Usage Examples

### 1. Search by Single Tag

```javascript
// Search for posts with "mountain" tag
const response = await fetch('/api/posts/search?tags=mountain');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?tags=mountain"
```

### 2. Search by Multiple Tags (Comma-separated)

```javascript
// Search for posts with multiple tags
const response = await fetch('/api/posts/search?tags=mountain,adventure,hiking');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?tags=mountain,adventure,hiking"
```

### 3. Search by Multiple Tags (JSON Array)

```javascript
// Search using JSON array format
const tags = JSON.stringify(['mountain', 'adventure', 'hiking']);
const response = await fetch(`/api/posts/search?tags=${encodeURIComponent(tags)}`);
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?tags=%5B%22mountain%22,%22adventure%22,%22hiking%22%5D"
```

### 4. Search by Location Name

```javascript
// Search for posts at specific location
const response = await fetch('/api/posts/search?location=Mount%20Everest');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?location=Mount%20Everest"
```

### 5. Search by City

```javascript
// Search for posts in a specific city
const response = await fetch('/api/posts/search?city=Buea');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?city=Buea"
```

### 6. Search by Country

```javascript
// Search for posts in a specific country
const response = await fetch('/api/posts/search?country=Cameroon');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?country=Cameroon"
```

## Advanced Usage Examples

### 7. Combined Search Filters

```javascript
// Search with multiple criteria
const response = await fetch('/api/posts/search?tags=mountain,adventure&city=Buea&country=Cameroon');
const data = await response.json();
```

```bash
# cURL example
curl "http://localhost:3000/api/posts/search?tags=mountain,adventure&city=Buea&country=Cameroon"
```

### 8. Search with Sorting

```javascript
// Sort by newest (default)
const newest = await fetch('/api/posts/search?tags=mountain&sortBy=newest');

// Sort by oldest
const oldest = await fetch('/api/posts/search?tags=mountain&sortBy=oldest');

// Sort by popularity (most liked)
const popular = await fetch('/api/posts/search?tags=mountain&sortBy=popular');
```

```bash
# cURL examples
curl "http://localhost:3000/api/posts/search?tags=mountain&sortBy=newest"
curl "http://localhost:3000/api/posts/search?tags=mountain&sortBy=oldest"
curl "http://localhost:3000/api/posts/search?tags=mountain&sortBy=popular"
```

### 9. Search with Pagination

```javascript
// Get first page with 10 results
const page1 = await fetch('/api/posts/search?tags=mountain&page=1&limit=10');

// Get second page
const page2 = await fetch('/api/posts/search?tags=mountain&page=2&limit=10');
```

```bash
# cURL examples
curl "http://localhost:3000/api/posts/search?tags=mountain&page=1&limit=10"
curl "http://localhost:3000/api/posts/search?tags=mountain&page=2&limit=10"
```

### 10. Complete Search Example

```javascript
// Comprehensive search with all parameters
const response = await fetch('/api/posts/search?' + new URLSearchParams({
  tags: 'mountain,adventure,hiking',
  city: 'Buea',
  country: 'Cameroon',
  sortBy: 'popular',
  page: 1,
  limit: 20
}));

const data = await response.json();
```

## Frontend Integration Examples

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const usePostSearch = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const searchPosts = async (searchParams) => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await fetch(`/api/posts/search?${queryString}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, pagination, searchPosts };
};

// Usage in component
const SearchComponent = () => {
  const { posts, loading, pagination, searchPosts } = usePostSearch();

  const handleSearch = () => {
    searchPosts({
      tags: 'mountain,adventure',
      city: 'Buea',
      sortBy: 'popular',
      page: 1,
      limit: 10
    });
  };

  return (
    <div>
      <button onClick={handleSearch}>Search Posts</button>
      {loading && <p>Loading...</p>}
      {posts.map(post => (
        <div key={post.$id}>
          <h3>{post.caption}</h3>
          <p>Tags: {post.tags.join(', ')}</p>
          <p>Likes: {post.likesCount}</p>
        </div>
      ))}
    </div>
  );
};
```

### Vue.js Example

```javascript
// Vue 3 Composition API
import { ref, reactive } from 'vue';

export default {
  setup() {
    const posts = ref([]);
    const loading = ref(false);
    const pagination = ref(null);
    
    const searchParams = reactive({
      tags: '',
      location: '',
      city: '',
      country: '',
      sortBy: 'newest',
      page: 1,
      limit: 20
    });

    const searchPosts = async () => {
      loading.value = true;
      try {
        const queryString = new URLSearchParams(searchParams).toString();
        const response = await fetch(`/api/posts/search?${queryString}`);
        const data = await response.json();
        
        if (data.success) {
          posts.value = data.data.posts;
          pagination.value = data.data.pagination;
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        loading.value = false;
      }
    };

    return {
      posts,
      loading,
      pagination,
      searchParams,
      searchPosts
    };
  }
};
```

## Response Structure

### Successful Response

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

### Error Response

```json
{
  "success": false,
  "error": "At least one search parameter (tags, location, city, or country) must be provided"
}
```

## Query Parameters Reference

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `tags` | string | No* | Tags to search for (JSON array or comma-separated) | `mountain,adventure` or `["mountain","adventure"]` |
| `location` | string | No* | Location name to search for | `Mount Everest` |
| `city` | string | No* | City name to search for | `Buea` |
| `country` | string | No* | Country name to search for | `Cameroon` |
| `sortBy` | string | No | Sort order: `newest`, `oldest`, `popular` | `popular` |
| `page` | integer | No | Page number (default: 1, min: 1) | `2` |
| `limit` | integer | No | Posts per page (default: 20, min: 1, max: 50) | `10` |

*At least one of: `tags`, `location`, `city`, or `country` must be provided.

## Best Practices

1. **URL Encoding**: Always encode special characters in query parameters
2. **Pagination**: Use reasonable limit values (10-20) for better performance
3. **Error Handling**: Always check the `success` field in responses
4. **Caching**: Consider caching search results for frequently used queries
5. **Debouncing**: Implement debouncing for real-time search to avoid excessive API calls

## Performance Considerations

- **Tag Searches**: More specific tags return faster results
- **Location Searches**: Exact matches are faster than partial matches
- **Sorting**: `newest` sorting is fastest, `popular` sorting may be slower for large datasets
- **Pagination**: Smaller page sizes (10-20) provide better response times
