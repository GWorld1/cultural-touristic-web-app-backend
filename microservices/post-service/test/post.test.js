  const request = require('supertest');
  const app = require('../server'); // Adjust path if needed



  // Health Check
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
    });
  });