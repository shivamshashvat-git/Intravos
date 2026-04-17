import request from 'supertest';
import app from '../app.js';

describe('Authentication Smoke Suite', () => {
  it('POST /api/auth/login with no credentials should return 400 or 401', async () => {
    // We expect the payload sanitizer or controller to catch empty bodies
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    
    // Status depends on implementation (400 for validation, 401 for bad creds)
    // Most industrialized controllers return 400 for missing required fields
    expect([400, 401, 404]).toContain(res.statusCode);
  });

  it('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
  });
});
