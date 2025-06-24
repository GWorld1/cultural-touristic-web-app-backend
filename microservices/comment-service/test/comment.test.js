const request = require('supertest');
const server = require('../server'); 

describe('GET /health', () => {
    
    afterAll((done) => {
        // Close the server and call 'done' when it's fully shut down
        server.close(() => {
            console.log('Comment service test server closed.');
            done();
        });
    });

    it('should return health status', async () => {
        
        const res = await request(server) 
            .get('/health') 
            .expect(200);
    });
});
