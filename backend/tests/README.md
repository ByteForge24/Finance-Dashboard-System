# Backend Tests

## Overview

This directory contains the test suite for the finance-dashboard backend. Tests are organized into two layers:

- **Unit tests**: Test individual functions and services in isolation
- **Integration tests**: Test API endpoints and their integration with services/database

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage report
```

## Structure

```
tests/
├── helpers/           # Shared test utilities
│   ├── test-app.ts   # Test app bootstrap
│   └── auth.ts       # Authentication helpers
├── integration/       # API integration tests
│   └── health.test.ts # Example health check test
└── unit/              # Unit tests for services
    └── date-utilities.test.ts # Example unit test
```

## Writing Tests

### Integration Tests (API)

Use Supertest to test endpoints. Example:

```typescript
import { testApp } from '../helpers/test-app.js';

describe('Users API', () => {
  it('should list users', async () => {
    const token = await loginUser('admin@example.com', 'password');
    
    await testApp()
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

Or use the auth helper for cleaner code:

```typescript
import { createAuthenticatedAgent } from '../helpers/auth.js';

describe('Users API', () => {
  it('should list users', async () => {
    const { agent } = await createAuthenticatedAgent('admin@example.com', 'password');
    
    await agent('get', '/api/v1/users').expect(200);
  });
});
```

### Unit Tests (Services)

Test business logic directly. Example:

```typescript
import { getSummary } from '../../src/modules/dashboard/dashboard.service.js';

describe('Dashboard Service', () => {
  it('should calculate correct summary', async () => {
    const result = await getSummary({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    expect(result).toHaveProperty('totalIncome');
    expect(result).toHaveProperty('totalExpense');
  });
});
```

## Test Helpers

### testApp()

Returns a Supertest agent for the test app.

```typescript
testApp().get('/api/v1/users').expect(200);
```

### loginUser(email, password)

Logs in a user and returns the JWT token.

```typescript
const token = await loginUser('admin@example.com', 'password');
```

### authenticatedRequest(req, token)

Adds Bearer token to a Supertest request.

```typescript
const req = testApp().get('/api/v1/users');
authenticatedRequest(req, token).expect(200);
```

### createAuthenticatedAgent(email, password)

Creates an authenticated agent for chaining requests with automatic token injection.

```typescript
const { token, agent } = await createAuthenticatedAgent('admin@example.com', 'password');
await agent('get', '/api/v1/users').expect(200);
```

## Notes

- All tests should be in `tests/` directory with `.test.ts` extension
- Use `describe()` and `it()` from Jest (no imports needed, globals are available)
- Keep tests isolated and independent
- Use meaningful test names that describe the behavior being tested
- Future roadmap items will include auth, access control, records, and dashboard tests
