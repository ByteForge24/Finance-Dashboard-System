import { testApp } from '../helpers/test-app.js';
import { loginUser } from '../helpers/auth.js';

function itIfDatabaseAvailable(testName: string, testFn: () => Promise<void>) {
  if (process.env.DATABASE_URL) {
    it(testName, testFn);
  } else {
    it.skip(testName, testFn);
  }
}

describe('Access Control', () => {
  describe('3.1 Viewer cannot create records', () => {
    itIfDatabaseAvailable('should return 403 when viewer attempts to create a record', async () => {
      const token = await loginUser('viewer@finance-dashboard.local', 'ViewerPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          type: 'income',
          category: 'Freelance',
          date: new Date().toISOString(),
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('3.2 Analyst cannot manage users', () => {
    itIfDatabaseAvailable('should return 403 when analyst attempts to create a user', async () => {
      const token = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123',
          role: 'ADMIN',
          status: 'ACTIVE',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });

    itIfDatabaseAvailable('should return 403 when analyst attempts to list users', async () => {
      const token = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('3.3 Admin can perform protected actions', () => {
    itIfDatabaseAvailable('should allow admin to create a record', async () => {
      const token = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 500,
          type: 'income',
          category: 'Salary',
          date: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('amount', 500);
      expect(response.body).toHaveProperty('type', 'income');
      expect(response.body).toHaveProperty('category', 'Salary');
    });

    itIfDatabaseAvailable('should allow admin to create a user', async () => {
      const token = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test User',
          email: `testuser${Date.now()}@example.com`,
          password: 'TestPassword123',
          role: 'viewer',
          status: 'active',
        })
        .expect(201);

      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    itIfDatabaseAvailable('should allow admin to list users', async () => {
      const token = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('3.4 Inactive users denied everywhere', () => {
    itIfDatabaseAvailable('should deny login for inactive user', async () => {
      const response = await testApp()
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@finance-dashboard.local',
          password: 'InactivePassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });
});
