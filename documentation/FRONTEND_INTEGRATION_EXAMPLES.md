# Frontend Integration Examples for 360-Degree Post System

## 1. A-Frame 360-Degree Viewer Integration

### Basic HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>360-Degree Post Viewer</title>
    <meta name="description" content="360-Degree Post Viewer">
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <style>
        .post-container {
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .post-header {
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
        }
        .post-author {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .post-caption {
            margin: 10px 0;
            line-height: 1.4;
        }
        .post-location {
            color: #666;
            font-size: 0.9em;
        }
        .panorama-viewer {
            height: 400px;
            width: 100%;
            position: relative;
        }
        .post-actions {
            padding: 15px;
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .like-btn, .comment-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .like-btn.liked {
            color: #e74c3c;
        }
        .comments-section {
            padding: 15px;
            border-top: 1px solid #ddd;
        }
        .comment {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .comment-author {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div id="posts-container">
        <!-- Posts will be dynamically loaded here -->
    </div>

    <script>
        // Post rendering functions will be added here
    </script>
</body>
</html>
```

### JavaScript Post Rendering
```javascript
class PostViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.posts = [];
        this.currentUser = null;
    }

    async loadPosts(page = 1, limit = 10) {
        try {
            const response = await fetch(`/api/posts?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.posts = data.data.posts;
                this.renderPosts();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPosts() {
        this.container.innerHTML = '';
        
        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            this.container.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-container';
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-author">${post.author?.name || 'Unknown User'}</div>
                <div class="post-caption">${post.caption}</div>
                ${post.location ? `<div class="post-location">📍 ${post.location.name}</div>` : ''}
            </div>
            
            <div class="panorama-viewer" id="viewer-${post.$id}">
                <a-scene embedded style="height: 100%; width: 100%;">
                    <a-sky src="${post.imageUrl}" rotation="0 -130 0"></a-sky>
                    <a-camera>
                        <a-cursor color="raycast"></a-cursor>
                    </a-camera>
                </a-scene>
            </div>
            
            <div class="post-actions">
                <button class="like-btn" onclick="postViewer.toggleLike('${post.$id}')">
                    ❤️ <span id="likes-${post.$id}">${post.likesCount}</span>
                </button>
                <button class="comment-btn" onclick="postViewer.toggleComments('${post.$id}')">
                    💬 <span>${post.commentsCount}</span>
                </button>
            </div>
            
            <div class="comments-section" id="comments-${post.$id}" style="display: none;">
                <div class="add-comment">
                    <textarea placeholder="Add a comment..." id="comment-input-${post.$id}"></textarea>
                    <button onclick="postViewer.addComment('${post.$id}')">Post Comment</button>
                </div>
                <div id="comments-list-${post.$id}">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        
        return postDiv;
    }

    async toggleLike(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}/likes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const likesSpan = document.getElementById(`likes-${postId}`);
                likesSpan.textContent = data.data.likesCount;
                
                const likeBtn = likesSpan.parentElement;
                if (data.data.isLiked) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        
        if (commentsSection.style.display === 'none') {
            commentsSection.style.display = 'block';
            await this.loadComments(postId);
        } else {
            commentsSection.style.display = 'none';
        }
    }

    async loadComments(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const data = await response.json();
            
            if (data.success) {
                const commentsList = document.getElementById(`comments-list-${postId}`);
                commentsList.innerHTML = '';
                
                data.data.comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment';
                    commentDiv.innerHTML = `
                        <div class="comment-author">${comment.author?.name || 'Unknown User'}</div>
                        <div>${comment.content}</div>
                    `;
                    commentsList.appendChild(commentDiv);
                });
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    async addComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        
        if (!content) return;
        
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            
            const data = await response.json();
            
            if (data.success) {
                input.value = '';
                await this.loadComments(postId);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }

    async createPost(formData) {
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadPosts(); // Reload posts
                return true;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }
}

// Initialize post viewer
const postViewer = new PostViewer('posts-container');

// Load posts when page loads
document.addEventListener('DOMContentLoaded', () => {
    postViewer.loadPosts();
});
```

## 2. React Component Example

### Post Feed Component
```jsx
import React, { useState, useEffect } from 'react';
import 'aframe';

const PostFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadPosts();
    }, [page]);

    const loadPosts = async () => {
        try {
            const response = await fetch(`/api/posts?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                setPosts(data.data.posts);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading posts...</div>;
    }

    return (
        <div className="post-feed">
            {posts.map(post => (
                <PostCard key={post.$id} post={post} />
            ))}
        </div>
    );
};

const PostCard = ({ post }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [showComments, setShowComments] = useState(false);

    const toggleLike = async () => {
        try {
            const response = await fetch(`/api/posts/${post.$id}/likes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                setLiked(data.data.isLiked);
                setLikesCount(data.data.likesCount);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <h3>{post.author?.name || 'Unknown User'}</h3>
                <p>{post.caption}</p>
                {post.location && (
                    <p className="location">📍 {post.location.name}</p>
                )}
            </div>
            
            <div className="panorama-viewer" style={{ height: '400px' }}>
                <a-scene embedded style={{ height: '100%', width: '100%' }}>
                    <a-sky src={post.imageUrl} rotation="0 -130 0"></a-sky>
                    <a-camera>
                        <a-cursor color="raycast"></a-cursor>
                    </a-camera>
                </a-scene>
            </div>
            
            <div className="post-actions">
                <button 
                    className={`like-btn ${liked ? 'liked' : ''}`}
                    onClick={toggleLike}
                >
                    ❤️ {likesCount}
                </button>
                <button 
                    className="comment-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    💬 {post.commentsCount}
                </button>
            </div>
            
            {showComments && (
                <CommentsSection postId={post.$id} />
            )}
        </div>
    );
};

export default PostFeed;
```

## 3. Mobile-Responsive CSS
```css
/* Mobile-first responsive design */
.post-container {
    margin: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background: white;
}

.panorama-viewer {
    height: 300px;
    width: 100%;
    position: relative;
}

/* Tablet and larger screens */
@media (min-width: 768px) {
    .post-container {
        margin: 20px auto;
        max-width: 600px;
    }
    
    .panorama-viewer {
        height: 400px;
    }
}

/* Desktop screens */
@media (min-width: 1024px) {
    .post-container {
        max-width: 800px;
    }
    
    .panorama-viewer {
        height: 500px;
    }
}

/* Touch-friendly controls for mobile */
@media (max-width: 767px) {
    .post-actions button {
        padding: 12px 16px;
        font-size: 16px;
        min-height: 44px; /* iOS touch target size */
    }
}
```

## 4. API Integration Examples

### Create Post Form
```javascript
const createPostForm = document.getElementById('create-post-form');

createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('image', document.getElementById('image-input').files[0]);
    formData.append('caption', document.getElementById('caption-input').value);
    formData.append('isPublic', document.getElementById('public-checkbox').checked);
    
    // Add location if provided
    const locationName = document.getElementById('location-input').value;
    if (locationName) {
        formData.append('location', JSON.stringify({ name: locationName }));
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Post created successfully!');
            createPostForm.reset();
            // Reload posts or redirect
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post');
    }
});
```

This comprehensive implementation provides a complete 360-degree post system that follows your existing architectural patterns and integrates seamlessly with your current codebase. The system includes proper error handling, authentication, file upload, and responsive design for optimal user experience across all devices.
