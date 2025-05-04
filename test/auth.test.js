const request = require('supertest');
const app = require('../server'); // Adjust path if needed
const { expect } = require('chai');

describe('Authentication Service', () => {
  let authToken;
  let userId;

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User',
    phone: '1234567890'
  };

  // Health Check
  describe('GET /api/auth/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/auth/health')
        .expect(200);
      
      expect(res.body).to.have.property('status', 'ok');
    });
  });

  // Registration
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('id');
      userId = res.body.user.id;
    });

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body).to.have.property('error');
    });
  });

  // Login
  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      authToken = res.body.token;
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).to.have.property('error');
    });
  });

  // Protected Routes
  describe('Protected Routes', () => {
    // Get Current User
    describe('GET /api/auth/me', () => {
      it('should get current user profile', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body).to.have.property('user');
        expect(res.body.user).to.have.property('email', testUser.email);
      });

      it('should fail without auth token', async () => {
        await request(app)
          .get('/api/auth/me')
          .expect(401);
      });
    });

    // Update Profile
    describe('PUT /api/auth/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          phone: '0987654321'
        };

        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body).to.have.property('message');
      });
    });
  });

  // Password Reset
  describe('Password Reset Flow', () => {
    it('should request password reset', async () => {
      const res = await request(app)
        .post('/api/auth/password/reset-request')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body).to.have.property('message');
    });
  });

  // Authentication Check
  describe('GET /api/auth/check-auth', () => {
    it('should confirm authenticated status with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/check-auth')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('authenticated', true);
      expect(res.body).to.have.property('user');
    });

    it('should return unauthenticated for invalid token', async () => {
      await request(app)
        .get('/api/auth/check-auth')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // Logout
  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('message');
    });
  });
});