import request from 'supertest';
import app from '../../src/app.js';

export interface AuthTokenResponse {
  token: string;
}

export async function loginUser(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  const { token } = response.body as { token: string };
  return token;
}

export function authenticatedRequest(req: request.Test, token: string): request.Test {
  return req.set('Authorization', `Bearer ${token}`);
}

export async function createAuthenticatedAgent(email: string, password: string) {
  const token = await loginUser(email, password);
  
  return {
    token,
    agent: (method: string, path: string) => {
      let req: request.Test;
      
      switch (method.toLowerCase()) {
        case 'get':
          req = request(app).get(path);
          break;
        case 'post':
          req = request(app).post(path);
          break;
        case 'patch':
          req = request(app).patch(path);
          break;
        case 'delete':
          req = request(app).delete(path);
          break;
        case 'put':
          req = request(app).put(path);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      return authenticatedRequest(req, token);
    },
  };
}
