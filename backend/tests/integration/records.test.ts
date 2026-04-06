import { testApp } from '../helpers/test-app.js';
import { loginUser } from '../helpers/auth.js';

function itIfDatabaseAvailable(testName: string, testFn: () => Promise<void>) {
  if (process.env.DATABASE_URL) {
    it(testName, testFn);
  } else {
    it.skip(testName, testFn);
  }
}

describe('Financial Records', () => {
  describe('4.1 Create record success', () => {
    itIfDatabaseAvailable('should create a record with valid data', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 250.50,
          type: 'expense',
          category: 'utilities',
          date: new Date().toISOString().split('T')[0],
          notes: 'electricity bill',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('amount', 250.50);
      expect(response.body).toHaveProperty('type', 'expense');
      expect(response.body).toHaveProperty('category', 'utilities');
      expect(response.body).toHaveProperty('notes', 'electricity bill');
      expect(response.body).toHaveProperty('createdBy');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    itIfDatabaseAvailable('should create an income record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 3500.00,
          type: 'income',
          category: 'freelance',
          date: new Date().toISOString().split('T')[0],
          notes: 'project payment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('type', 'income');
      expect(response.body).toHaveProperty('amount', 3500.00);
    });
  });

  describe('4.2 Create record validation failure', () => {
    itIfDatabaseAvailable('should fail with missing amount', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'expense',
          category: 'utilities',
          date: new Date().toISOString().split('T')[0],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('should fail with negative amount', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -50,
          type: 'expense',
          category: 'utilities',
          date: new Date().toISOString().split('T')[0],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('should fail with invalid type', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: 'invalid',
          category: 'utilities',
          date: new Date().toISOString().split('T')[0],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('should fail with missing category', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('should fail with invalid date', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: 'expense',
          category: 'utilities',
          date: 'not-a-date',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('4.3 List records with filters', () => {
    itIfDatabaseAvailable('should list records as admin', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    itIfDatabaseAvailable('should list records as analyst', async () => {
      const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    itIfDatabaseAvailable('should filter records by type', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((record: any) => {
        expect(record.type).toBe('income');
      });
    });

    itIfDatabaseAvailable('should filter records by category', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/records?category=Salary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    itIfDatabaseAvailable('should filter records by date range', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const queryString = `startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;

      const response = await testApp()
        .get(`/api/v1/records?${queryString}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('4.4 Update record success', () => {
    itIfDatabaseAvailable('should update an existing record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 75.00,
          type: 'expense',
          category: 'food',
          date: new Date().toISOString().split('T')[0],
          notes: 'lunch',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      const updateResponse = await testApp()
        .patch(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 85.00,
          notes: 'lunch and coffee',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('id', recordId);
      expect(updateResponse.body).toHaveProperty('amount', 85.00);
      expect(updateResponse.body).toHaveProperty('notes', 'lunch and coffee');
      expect(updateResponse.body).toHaveProperty('category', 'food');
      expect(updateResponse.body).toHaveProperty('type', 'expense');
    });

    itIfDatabaseAvailable('should update only specified fields', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 60.00,
          type: 'expense',
          category: 'transport',
          date: new Date().toISOString().split('T')[0],
          notes: 'taxi',
        })
        .expect(201);

      const recordId = createResponse.body.id;
      const originalDate = createResponse.body.date;

      const updateResponse = await testApp()
        .patch(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 70.00,
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('amount', 70.00);
      expect(updateResponse.body).toHaveProperty('category', 'transport');
      expect(updateResponse.body).toHaveProperty('date', originalDate);
    });
  });

  describe('4.5 Delete record success', () => {
    itIfDatabaseAvailable('should delete an existing record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.00,
          type: 'expense',
          category: 'entertainment',
          date: new Date().toISOString().split('T')[0],
          notes: 'movie',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await testApp()
        .get(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('4.6 Non-existent record returns 404', () => {
    itIfDatabaseAvailable('should return 404 when getting non-existent record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      await testApp()
        .get('/api/v1/records/non-existent-id-12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    itIfDatabaseAvailable('should return 404 when updating non-existent record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      await testApp()
        .patch('/api/v1/records/non-existent-id-12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
        })
        .expect(404);
    });

    itIfDatabaseAvailable('should return 404 when deleting non-existent record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      await testApp()
        .delete('/api/v1/records/non-existent-id-12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('4.7 Soft delete behavior', () => {
    itIfDatabaseAvailable('soft delete should mark record as deleted', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 99.99,
          type: 'expense',
          category: 'utilities',
          date: new Date().toISOString().split('T')[0],
          notes: 'test soft delete',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify the record is no longer accessible via GET
      await testApp()
        .get(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    itIfDatabaseAvailable('soft-deleted record should not appear in list', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150.00,
          type: 'expense',
          category: 'food',
          date: new Date().toISOString().split('T')[0],
          notes: 'test list exclusion',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Get list before delete (record should be present)
      const listBeforeDelete = await testApp()
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const recordBeforeDelete = listBeforeDelete.body.data.find((r: any) => r.id === recordId);
      expect(recordBeforeDelete).toBeDefined();

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Get list after delete (record should not be present)
      const listAfterDelete = await testApp()
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const recordAfterDelete = listAfterDelete.body.data.find((r: any) => r.id === recordId);
      expect(recordAfterDelete).toBeUndefined();
    });

    itIfDatabaseAvailable('update should fail for soft-deleted record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 200.00,
          type: 'expense',
          category: 'entertainment',
          date: new Date().toISOString().split('T')[0],
          notes: 'test update after delete',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Try to update the deleted record
      await testApp()
        .patch(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 210.00,
        })
        .expect(404);
    });

    itIfDatabaseAvailable('delete should fail for already soft-deleted record', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 300.00,
          type: 'expense',
          category: 'transport',
          date: new Date().toISOString().split('T')[0],
          notes: 'test double delete',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Try to delete the same record again
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('4.8 Category suggestion endpoint', () => {
    itIfDatabaseAvailable('admin can get category suggestion', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'grocery shopping at whole foods',
        })
        .expect(200);

      expect(response.body).toHaveProperty('suggestedCategory');
      expect(response.body).toHaveProperty('alternatives');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('source');
      expect(['high', 'medium', 'low']).toContain(response.body.confidence);
      expect(['ai', 'fallback']).toContain(response.body.source);
    });

    itIfDatabaseAvailable('analyst can get category suggestion', async () => {
      const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          notes: 'monthly electricity bill payment',
        })
        .expect(200);

      expect(response.body).toHaveProperty('suggestedCategory');
      expect(response.body).toHaveProperty('alternatives');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('source');
    });

    itIfDatabaseAvailable('viewer is denied access to category suggestion', async () => {
      const viewerToken = await loginUser('viewer@finance-dashboard.local', 'ViewerPassword123');

      await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          notes: 'grocery shopping',
        })
        .expect(403);
    });

    itIfDatabaseAvailable('unauthenticated request is rejected', async () => {
      await testApp()
        .post('/api/v1/records/suggest-category')
        .send({
          notes: 'grocery shopping',
        })
        .expect(401);
    });

    itIfDatabaseAvailable('missing notes field returns 400', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'expense',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('empty notes field returns 400', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    itIfDatabaseAvailable('fallback suggestion works for common expense notes', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'grocery shopping at supermarket',
          type: 'expense',
        })
        .expect(200);

      expect(Array.isArray(response.body.alternatives)).toBe(true);
      expect(response.body).toHaveProperty('confidence');
      // Should have a suggestion (either AI or fallback)
      expect(response.body.suggestedCategory !== undefined).toBe(true);
    });

    itIfDatabaseAvailable('fallback suggestion works for common income notes', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'monthly salary payment',
          type: 'income',
        })
        .expect(200);

      expect(Array.isArray(response.body.alternatives)).toBe(true);
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.suggestedCategory !== undefined).toBe(true);
    });

    itIfDatabaseAvailable('alternatives does not include duplicates', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .post('/api/v1/records/suggest-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'some transaction',
        })
        .expect(200);

      const { suggestedCategory, alternatives } = response.body;

      // Check for duplicates in alternatives
      const seen = new Set<string>();
      for (const alt of alternatives) {
        if (seen.has(alt.toLowerCase())) {
          throw new Error('Duplicate alternative found');
        }
        seen.add(alt.toLowerCase());
      }

      // Check that suggestedCategory is not in alternatives
      if (suggestedCategory && alternatives.map((a: string) => a.toLowerCase()).includes(suggestedCategory.toLowerCase())) {
        throw new Error('suggestedCategory should not be in alternatives');
      }
    });
  });
});
