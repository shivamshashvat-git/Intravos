import request from 'supertest';
import app from '../app.js';

describe('Platform Health Suite', () => {
  it('GET /health should return 200 and ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/void-route');
    expect(res.statusCode).toEqual(404);
  });
});
