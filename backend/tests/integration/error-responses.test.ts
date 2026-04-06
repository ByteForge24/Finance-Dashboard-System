import { testApp } from '../helpers/test-app.js';

describe('Error Responses', () => {
  it('should return 404 for unknown routes', async () => {
    await testApp()
      .get('/api/v1/unknown')
      .expect(404);
  });

  it('should return proper error response for unknown routes', async () => {
    const response = await testApp()
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });
});
