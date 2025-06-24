const request = require('supertest');
const server = require('../server'); // Now imports the 'server' instance directly

describe('GET /api/auth/health', () => {
    // This hook runs after all tests in this describe block have finished
    afterAll((done) => {
        // Close the server and call 'done' when it's fully shut down
        server.close(() => {
            console.log('Auth service test server closed.');
            done();
        });
    });

    it('should return health status', async () => {
        // Use the 'server' instance with supertest, as it's directly runnable
        const res = await request(server) // Use 'server' here
            .get('/api/auth/health')
            .expect(200);
    });
});
