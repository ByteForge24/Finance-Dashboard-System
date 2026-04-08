import { testApp } from '../helpers/test-app.js';
import { generateToken } from '../../src/modules/auth/auth.token.js';
import { Role } from '../../src/shared/domain/role.js';

describe('Auth Module', () => {
  // Generate unique suffix for test emails to avoid conflicts across test runs
  const testSuffix = Date.now();

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
    it('should fail login with invalid password (differentiated error)', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@finance-dashboard.local',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Incorrect password. Please try again.');
    });

    it('should fail login with unknown email (differentiated error)', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'SomePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User not found. Please sign up first.');
    });
  });

  describe('POST /api/v1/auth/login - Inactive User Denied', () => {
    it('should deny login for inactive user (differentiated error)', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@finance-dashboard.local',
          password: 'InactivePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Account is inactive. Contact support.');
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

  describe('POST /api/v1/auth/signup - Signup Success', () => {
    it('should signup successfully with valid credentials', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'New User',
          email: `newuser-${testSuffix}@example.com`,
          password: 'NewSecurePassword123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', `newuser-${testSuffix}@example.com`);
      expect(response.body.user).toHaveProperty('name', 'New User');
      expect(response.body.user).toHaveProperty('role', 'viewer');
      expect(response.body.user).toHaveProperty('status', 'active');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('should assign VIEWER role by default on signup', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Viewer Default User',
          email: `viewerdefault-${testSuffix}@example.com`,
          password: 'SecurePassword123',
        })
        .expect(201);

      expect(response.body.user.role).toBe('viewer');
    });

    it('should create user with ACTIVE status by default', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Active Status User',
          email: `activestatus-${testSuffix}@example.com`,
          password: 'SecurePassword123',
        })
        .expect(201);

      expect(response.body.user.status).toBe('active');
    });

    it('should normalize email to lowercase on signup', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Email Case Test',
          email: `TestEmail-${testSuffix}@EXAMPLE.COM`,
          password: 'SecurePassword123',
        })
        .expect(201);

      expect(response.body.user.email).toBe(`testemail-${testSuffix}@example.com`);
    });
  });

  describe('POST /api/v1/auth/signup - Duplicate Email', () => {
    it('should return 409 when signup email already exists', async () => {
      const email = `duplicate-test-${testSuffix}@example.com`;
      // First, create a user
      await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Original User',
          email,
          password: 'SecurePassword123',
        })
        .expect(201);

      // Then try to signup with same email
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Duplicate Attempt',
          email,
          password: 'SecurePassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email address is already in use');
    });
  });

  describe('POST /api/v1/auth/signup - Reserved Demo Email', () => {
    it('should reject signup with reserved VIEWER demo email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Viewer Demo',
          email: 'viewer@finance-dashboard.local',
          password: 'SecurePassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('This email address is reserved for demo access');
    });

    it('should reject signup with reserved ANALYST demo email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Analyst Demo',
          email: 'analyst@finance-dashboard.local',
          password: 'SecurePassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('This email address is reserved for demo access');
    });

    it('should reject signup with reserved ADMIN demo email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Admin Demo',
          email: 'admin@finance-dashboard.local',
          password: 'SecurePassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('This email address is reserved for demo access');
    });

    it('should reject signup with reserved INACTIVE demo email', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Inactive Demo',
          email: 'inactive@finance-dashboard.local',
          password: 'SecurePassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('This email address is reserved for demo access');
    });
  });

  describe('POST /api/v1/auth/signup - Validation', () => {
    it('should fail signup with missing name', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          email: `test-${testSuffix}@example.com`,
          password: 'SecurePassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });

    it('should fail signup with invalid email format', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'SecurePassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });

    it('should fail signup with password too short', async () => {
      const response = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: `test2-${testSuffix}@example.com`,
          password: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('POST /api/v1/auth/signup - Auto-Login After Signup', () => {
    it('should return valid token that works with /auth/me', async () => {
      const signupResponse = await testApp()
        .post('/api/v1/auth/signup')
        .send({
          name: 'Token Test User',
          email: `tokentest-${testSuffix}@example.com`,
          password: 'SecurePassword123',
        })
        .expect(201);

      const token = signupResponse.body.token;

      const meResponse = await testApp()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body).toHaveProperty('email', `tokentest-${testSuffix}@example.com`);
      expect(meResponse.body).toHaveProperty('name', 'Token Test User');
      expect(meResponse.body).toHaveProperty('role', 'viewer');
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
