const request = require('supertest');
const server = require('../server'); 

describe('GET /api/auth/health', () => {
   
    afterAll((done) => {
        // Close the server and call 'done' when it's fully shut down
        server.close(() => {
            console.log('Auth service test server closed.');
            done();
        });
    });

    it('should return health status', async () => {
        
        const res = await request(server) 
            .get('/api/auth/health')
            .expect(200);
    });
});
