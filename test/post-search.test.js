const request = require('supertest');
const app = require('../server');
const { expect } = require('chai');

describe('Post Search API', () => {
  let authToken;
  let userId;

  // Test user data
  const testUser = {
    email: 'searchtest@example.com',
    password: 'Test123!@#',
    name: 'Search Test User',
    phone: '1234567890'
  };

  // Setup: Register and login user
  before(async () => {
    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    if (registerRes.status === 201) {
      userId = registerRes.body.user.id;
    }

    // Login user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    if (loginRes.status === 200) {
      authToken = loginRes.body.token;
      userId = loginRes.body.user.id;
    }
  });

  describe('GET /api/posts/search', () => {
    
    describe('Validation Tests', () => {
      it('should return 400 when no search parameters provided', async () => {
        const res = await request(app)
          .get('/api/posts/search')
          .expect(400);

        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.include('At least one search parameter');
      });

      it('should return 400 for invalid page number', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&page=0')
          .expect(400);

        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('error');
      });

      it('should return 400 for invalid limit', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&limit=0')
          .expect(400);

        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('error');
      });

      it('should return 400 for limit exceeding maximum', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&limit=100')
          .expect(400);

        expect(res.body).to.have.property('success', false);
        expect(res.body.error).to.include('Limit must be between 1 and 50');
      });
    });

    describe('Search Functionality Tests', () => {
      it('should search posts by single tag (comma-separated)', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('posts');
        expect(res.body.data).to.have.property('pagination');
        expect(res.body.data).to.have.property('searchParams');
        expect(res.body.data.searchParams.tags).to.include('mountain');
      });

      it('should search posts by multiple tags (comma-separated)', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain,adventure,hiking')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.tags).to.deep.equal(['mountain', 'adventure', 'hiking']);
      });

      it('should search posts by tags (JSON array format)', async () => {
        const tags = JSON.stringify(['mountain', 'adventure']);
        const res = await request(app)
          .get(`/api/posts/search?tags=${encodeURIComponent(tags)}`)
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.tags).to.deep.equal(['mountain', 'adventure']);
      });

      it('should search posts by location name', async () => {
        const res = await request(app)
          .get('/api/posts/search?location=Mount%20Everest')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.location).to.equal('Mount Everest');
      });

      it('should search posts by city', async () => {
        const res = await request(app)
          .get('/api/posts/search?city=Buea')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.city).to.equal('Buea');
      });

      it('should search posts by country', async () => {
        const res = await request(app)
          .get('/api/posts/search?country=Cameroon')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.country).to.equal('Cameroon');
      });

      it('should search posts with combined filters', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&city=Buea&country=Cameroon')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.tags).to.include('mountain');
        expect(res.body.data.searchParams.city).to.equal('Buea');
        expect(res.body.data.searchParams.country).to.equal('Cameroon');
      });
    });

    describe('Sorting Tests', () => {
      it('should sort posts by newest (default)', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.sortBy).to.equal('newest');
      });

      it('should sort posts by oldest', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&sortBy=oldest')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.sortBy).to.equal('oldest');
      });

      it('should sort posts by popular', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&sortBy=popular')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data.searchParams.sortBy).to.equal('popular');
      });

      it('should return 400 for invalid sortBy parameter', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&sortBy=invalid')
          .expect(400);

        expect(res.body).to.have.property('success', false);
        expect(res.body.error).to.include('Sort by must be newest, oldest, or popular');
      });
    });

    describe('Pagination Tests', () => {
      it('should return paginated results with default values', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        expect(res.body.data.pagination).to.have.property('page', 1);
        expect(res.body.data.pagination).to.have.property('limit', 20);
        expect(res.body.data.pagination).to.have.property('total');
        expect(res.body.data.pagination).to.have.property('totalPages');
        expect(res.body.data.pagination).to.have.property('hasNextPage');
        expect(res.body.data.pagination).to.have.property('hasPrevPage');
      });

      it('should return paginated results with custom page and limit', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain&page=1&limit=5')
          .expect(200);

        expect(res.body.data.pagination).to.have.property('page', 1);
        expect(res.body.data.pagination).to.have.property('limit', 5);
      });
    });

    describe('Response Structure Tests', () => {
      it('should return correct response structure', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('data');
        
        // Check data structure
        expect(res.body.data).to.have.property('posts');
        expect(res.body.data).to.have.property('pagination');
        expect(res.body.data).to.have.property('searchParams');
        
        // Check posts array structure
        expect(res.body.data.posts).to.be.an('array');
        
        // Check searchParams structure
        expect(res.body.data.searchParams).to.have.property('tags');
        expect(res.body.data.searchParams).to.have.property('location');
        expect(res.body.data.searchParams).to.have.property('city');
        expect(res.body.data.searchParams).to.have.property('country');
        expect(res.body.data.searchParams).to.have.property('sortBy');
      });

      it('should return posts with correct structure when found', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        if (res.body.data.posts.length > 0) {
          const post = res.body.data.posts[0];
          
          // Check post structure
          expect(post).to.have.property('$id');
          expect(post).to.have.property('authorId');
          expect(post).to.have.property('caption');
          expect(post).to.have.property('imageUrl');
          expect(post).to.have.property('tags');
          expect(post).to.have.property('isPublic');
          expect(post).to.have.property('status');
          expect(post).to.have.property('likesCount');
          expect(post).to.have.property('commentsCount');
          expect(post).to.have.property('viewsCount');
          expect(post).to.have.property('$createdAt');
          expect(post).to.have.property('$updatedAt');
          
          // Check author structure
          if (post.author) {
            expect(post.author).to.have.property('id');
            expect(post.author).to.have.property('name');
            expect(post.author).to.have.property('email');
          }
        }
      });
    });

    describe('Authentication Tests', () => {
      it('should work without authentication (public endpoint)', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .expect(200);

        expect(res.body).to.have.property('success', true);
      });

      it('should work with authentication', async () => {
        const res = await request(app)
          .get('/api/posts/search?tags=mountain')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body).to.have.property('success', true);
      });
    });
  });
});
