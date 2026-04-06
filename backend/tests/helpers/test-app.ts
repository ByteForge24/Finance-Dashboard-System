import app from '../../src/app.js';
import request from 'supertest';

export function testApp() {
  return request(app);
}

export async function initTestApp() {
  return app;
}
