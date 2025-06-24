const request = require('supertest');
const server = require('../server'); 

describe('GET /health', () => {
   
    afterAll((done) => {
        
        server.close(() => {
            console.log('Post service test server closed.');
            done();
        });
    });

    it('should return health status', async () => {
        
        const res = await request(server) 
            .get('/health')
            .expect(200);
    });
});
