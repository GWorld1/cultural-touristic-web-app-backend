  const request = require('supertest');
  const app = require('../server'); // Adjust path if needed



  // Health Check
  describe('GET /api/auth/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/auth/health')
        .expect(200);
    });
  });