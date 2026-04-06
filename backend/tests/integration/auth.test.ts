import { testApp } from '../helpers/test-app.js';
import { generateToken } from '../../src/modules/auth/auth.token.js';
import { Role } from '../../src/shared/domain/role.js';

describe('Auth Module', () => {
  describe('POST /api/v1/auth/login - Login Success', () => {
    it('should login successfully with valid admin credentials', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@finance-dashboard.local',
          password: 'AdminPassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'admin@finance-dashboard.local');
      expect(response.body.user).toHaveProperty('name', 'Admin User');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('should login successfully with valid viewer credentials', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'viewer@finance-dashboard.local',
          password: 'ViewerPassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'viewer@finance-dashboard.local');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /api/v1/auth/login - Login Failure', () => {
    it('should fail login with invalid password', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@finance-dashboard.local',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail login with unknown email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'SomePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/login - Inactive User Denied', () => {
    it('should deny login for inactive user', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@finance-dashboard.local',
          password: 'InactivePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User account is inactive');
    });
  });

  describe('POST /api/v1/auth/login - Validation', () => {
    it('should fail with missing email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          password: 'SomePassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });

    it('should fail with missing password', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('GET /api/v1/auth/me - Token Requirements', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const response = await testApp()
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 when Bearer format is invalid', async () => {
      const response = await testApp()
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 when Bearer token is empty', async () => {
      const response = await testApp()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await testApp()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should return 401 for malformed token', async () => {
      const response = await testApp()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer a.b.c.d.e')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Auth Token Generation', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateToken({
        userId: 'test-user-123',
        email: 'test@example.com',
        role: Role.Admin,
      });

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate JWT with correct payload structure', () => {
      const token = generateToken({
        userId: 'user-456',
        email: 'user@example.com',
        role: Role.Viewer,
      });

      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      const [, payloadEncoded] = parts;
      const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());
      expect(payload).toHaveProperty('userId', 'user-456');
      expect(payload).toHaveProperty('email', 'user@example.com');
    });

    it('should include role in token payload', () => {
      const token = generateToken({
        userId: 'analyst-789',
        email: 'analyst@example.com',
        role: Role.Analyst,
      });

      const parts = token.split('.');
      const [, payloadEncoded] = parts;
      const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());
      expect(payload).toHaveProperty('role', Role.Analyst);
    });
  });
});
