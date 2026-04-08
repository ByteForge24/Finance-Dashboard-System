# Local Testing Guide - Hybrid Demo + Authentication System

## Quick Start (5 minutes)

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

Expected output:
```
Using fallback category suggester (no OpenAI API key configured)
Backend server running on http://localhost:3000
```

---

## Testing Links & Endpoints

### Health Check (No Auth Required)
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T14:30:00.000Z",
  "service": "finance-dashboard-backend"
}
```

---

## Demo Access Testing (Hybrid Model)

### Demo Account 1: Admin User
**Email:** `admin@finance-dashboard.local`  
**Password:** `AdminPassword123`

#### Login as Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance-dashboard.local",
    "password": "AdminPassword123"
  }'
```

Expected response (201):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin User",
    "email": "admin@finance-dashboard.local",
    "role": "admin",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Demo Account 2: Analyst User
**Email:** `analyst@finance-dashboard.local`  
**Password:** `AnalystPassword123`

#### Login as Analyst
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@finance-dashboard.local",
    "password": "AnalystPassword123"
  }'
```

---

### Demo Account 3: Viewer User
**Email:** `viewer@finance-dashboard.local`  
**Password:** `ViewerPassword123`

#### Login as Viewer
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@finance-dashboard.local",
    "password": "ViewerPassword123"
  }'
```

---

### Demo Account 4: Inactive User (Test Error Handling)
**Email:** `inactive@finance-dashboard.local`  
**Password:** `InactivePassword123`

#### Try to Login (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inactive@finance-dashboard.local",
    "password": "InactivePassword123"
  }'
```

Expected response (401):
```json
{
  "error": "UnauthorizedError",
  "message": "Account is inactive. Contact support."
}
```

---

## User Signup Testing

### Create New User Account
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

Expected response (201):
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "viewer",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Note: New users always get VIEWER role
- No way to self-assign ANALYST or ADMIN roles
- Contact admin to upgrade roles

---

## Error Scenarios Testing

### Login Error 1: User Not Found
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doesnotexist@example.com",
    "password": "AnyPassword123"
  }'
```

Expected response (401):
```json
{
  "error": "UnauthorizedError",
  "message": "User not found. Please sign up first."
}
```

---

### Login Error 2: Wrong Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance-dashboard.local",
    "password": "WrongPassword123"
  }'
```

Expected response (401):
```json
{
  "error": "UnauthorizedError",
  "message": "Incorrect password. Please try again."
}
```

---

### Signup Error 1: Duplicate Email
First signup succeeds, then try again with same email:

```bash
# First signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'

# Second signup with same email (will fail)
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test@example.com",
    "password": "DifferentPassword123"
  }'
```

Expected response (409):
```json
{
  "error": "ConflictError",
  "message": "Email address is already in use"
}
```

---

### Signup Error 2: Reserved Demo Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hacker",
    "email": "admin@finance-dashboard.local",
    "password": "SecurePassword123"
  }'
```

Expected response (409):
```json
{
  "error": "ConflictError",
  "message": "This email address is reserved for demo access"
}
```

---

### Signup Error 3: Invalid Password (Too Short)
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test2@example.com",
    "password": "short"
  }'
```

Expected response (400):
```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": [
    {
      "field": "password",
      "issue": "must be at least 8 characters"
    }
  ]
}
```

---

## Token Validation Testing

### Get Current User (Requires Token)

1. First, login to get a token:
```bash
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance-dashboard.local",
    "password": "AdminPassword123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
```

2. Then use token to get current user:
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Admin User",
  "email": "admin@finance-dashboard.local",
  "role": "admin",
  "status": "active"
}
```

### Test Missing Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me
```

Expected response (401):
```json
{
  "error": "UnauthorizedError",
  "message": "Authentication required"
}
```

---

## Rate Limiting Testing

### Hit Login Rate Limit
Try 6 failed login attempts (limit is 5 per 15 minutes):

```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@finance-dashboard.local",
      "password": "WrongPassword123"
    }'
  echo "Attempt $i"
done
```

After 5 failed attempts, 6th request returns (429):
```json
{
  "error": "TooManyRequestsError",
  "message": "Too many login attempts, please try again after 15 minutes."
}
```

---

## Frontend Testing

### Start Frontend (if available)
```bash
cd frontend
# Open in browser
open index.html
# Or serve with Python
python -m http.server 5500
```

### Access Frontend
```
http://localhost:5500
```

### Test Demo Access
1. See "Sign In" tab with 4 demo cards
2. Click any card (auto-fills email + password)
3. Click "Login"
4. Redirects to dashboard

### Test User Signup
1. Click "Sign Up" tab
2. Enter name, email, password
3. Click "Sign Up"
4. Auto-logged in as VIEWER
5. Redirects to dashboard

---

## API Documentation

### Interactive API Spec
```
http://localhost:3000/api-docs
```

Or view source:
```bash
cat backend/docs/openapi.yaml
```

### Authentication Documentation
```bash
cat backend/docs/AUTHENTICATION.md
```

---

## Test Suite

### Run All Tests
```bash
cd backend
npm test
```

Expected: 151 tests passed (7 suites)

### Run Only Auth Tests
```bash
npm test -- tests/integration/auth.test.ts
```

Expected: 28 tests passed

### Run With Coverage
```bash
npm test -- --coverage
```

---

## Debugging

### View Server Logs
Backend logs all requests:
```
POST /api/v1/auth/login 200 150ms
POST /api/v1/auth/signup 201 200ms
GET /api/v1/auth/me 200 50ms
```

### Enable Debug Mode
```bash
DEBUG=* npm run dev
```

### Database
```bash
# View schema
cat backend/prisma/schema.prisma

# Run migrations
npm run prisma migrate dev

# View seed data
npm run prisma db seed
```

---

## Common Issues & Solutions

### "Connection refused" → Server not running
```bash
cd backend && npm run dev
```

### "ENOENT: no such file or directory" → Wrong directory
```bash
# Make sure you're in backend/
pwd  # Should show: .../finance-dashboard-system/backend
```

### "CORS error" → Frontend/backend mismatch
```bash
# Check CORS config in backend/.env
CORS_ORIGIN=http://localhost:5500
```

### "Port 3000 already in use"
```bash
# Kill existing process
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
```

---

## Summary of Test Matrix

| Scenario | Endpoint | Status | Error Message |
|----------|----------|--------|---------------|
| **Demo: Admin Login** | POST /login | 200 | ✓ Token issued |
| **Demo: Analyst Login** | POST /login | 200 | ✓ Token issued |
| **Demo: Viewer Login** | POST /login | 200 | ✓ Token issued |
| **Demo: Inactive Login** | POST /login | 401 | "Account is inactive..." |
| **Signup Success** | POST /signup | 201 | ✓ New user, VIEWER role |
| **Login: User Not Found** | POST /login | 401 | "User not found..." |
| **Login: Wrong Password** | POST /login | 401 | "Incorrect password..." |
| **Signup: Duplicate Email** | POST /signup | 409 | "Email already in use" |
| **Signup: Reserved Email** | POST /signup | 409 | "Reserved for demo..." |
| **Signup: Short Password** | POST /signup | 400 | "Must be 8+ chars" |
| **Auth: Get Current User** | GET /me | 200 | ✓ User object |
| **Auth: No Token** | GET /me | 401 | "Authentication required" |
| **Rate Limit: 6th Login Attempt** | POST /login | 429 | "Too many attempts" |

---

## Need More Help?

**Documentation Files:**
- [backend/docs/AUTHENTICATION.md](./backend/docs/AUTHENTICATION.md) - Complete auth guide
- [backend/docs/openapi.yaml](./backend/docs/openapi.yaml) - OpenAPI specification
- [backend/README.md](./backend/README.md) - Backend setup
- [README.md](./README.md) - Project overview

**Tests:**
- [backend/tests/integration/auth.test.ts](./backend/tests/integration/auth.test.ts) - Auth test suite

**Implementation:**
- [backend/src/modules/auth/](./backend/src/modules/auth/) - Auth module code
