# Authentication System Documentation

## Overview

The Finance Dashboard System uses a **Hybrid Demo + Authentication System** that supports both:
- **Demo Access**: Predefined demo accounts for quick evaluation without creating an account
- **User Signup**: New users can create accounts, which defaults to VIEWER role with ACTIVE status

This hybrid approach allows evaluators to test core functionality immediately while supporting long-term users through account creation.

## Authentication Architecture

### Session Model
- **Stateless JWT Tokens**: Authorization via Bearer tokens in the `Authorization` header
- **No Server-Side Sessions**: All information needed for authorization is in the JWT itself
- **Client-Side Storage**: Tokens are stored in `localStorage` on the frontend and sent with each API request
- **Automatic Validation**: All protected routes validate tokens before processing requests

### Token Structure
- **Algorithm**: HMAC-SHA256
- **Format**: JWT (3 parts: header.payload.signature)
- **Payload Includes**: `userId`, `email`, `role`
- **Expiration**: Set via environment config (default: per implementation)

## Authentication Endpoints

### 1. POST /api/v1/auth/login
Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "email": "admin@finance-dashboard.local",
  "password": "AdminPassword123"
}
```

**Success Response (200 OK):**
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

**Error Responses:**

| Status | Scenario | Message |
|--------|----------|---------|
| 401 | Email doesn't exist | "User not found. Please sign up first." |
| 401 | Password incorrect | "Incorrect password. Please try again." |
| 401 | User inactive | "Account is inactive. Contact support." |
| 400 | Validation error | Details in `details` array |
| 429 | Rate limit exceeded | "Too many login attempts, please try again after 15 minutes." |

**Rate Limiting:**
- 5 failed attempts per 15 minutes per IP address
- Successful requests do NOT count toward the limit
- Used to prevent brute-force attacks

### 2. POST /api/v1/auth/signup
Create a new user account with email, name, and password.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (201 Created):**
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

**New User Defaults:**
- **Role**: `viewer` (cannot be changed during signup)
- **Status**: `active` (users can login immediately)
- **Email**: Normalized to lowercase

**Error Responses:**

| Status | Scenario | Message |
|--------|----------|---------|
| 400 | Missing fields | Details in `details` array (name, email, or password missing) |
| 400 | Invalid email format | Details in `details` array |
| 400 | Password < 8 characters | Details in `details` array |
| 409 | Email already exists | "Email address is already in use" |
| 409 | Reserved demo email | "This email address is reserved for demo access" |
| 429 | Rate limit exceeded | "Too many signup attempts, please try again after 1 hour." |

**Reserved Demo Emails:**
The following emails are reserved for demo access and cannot be used for user signup:
- `admin@finance-dashboard.local`
- `analyst@finance-dashboard.local`
- `viewer@finance-dashboard.local`
- `inactive@finance-dashboard.local`

**Rate Limiting:**
- 10 signup attempts per 1 hour per IP address
- Successful requests do NOT count toward the limit
- Used to prevent abuse and spam registrations

**Auto-Login Behavior:**
After successful signup, the response includes a valid JWT token in `token`. This token:
- Can immediately be used to authenticate requests
- Works with `/auth/me` endpoint to fetch current user
- Can be stored in `localStorage` to maintain session across page reloads

### 3. GET /api/v1/auth/me
Retrieve the current authenticated user's profile.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Admin User",
  "email": "admin@finance-dashboard.local",
  "role": "admin",
  "status": "active"
}
```

**Error Responses:**

| Status | Scenario |
|--------|----------|
| 401 | Missing or invalid Authorization header |
| 401 | Token expired or malformed |
| 401 | User no longer exists |

## Demo Access vs. User Signup

### Demo Access (Hybrid Model - Evaluator Flow)
**How to Use:**
1. Visit the login page
2. Click "Sign In" tab (default)
3. Select one of the demo cards (Viewer, Analyst, Admin, or Inactive)
4. Auto-fills email and password
5. Click "Login"

**Available Demo Accounts:**
| Role | Email | Password | Access |
|------|-------|----------|--------|
| VIEWER | viewer@finance-dashboard.local | ViewerPassword123 | Full access to viewer features |
| ANALYST | analyst@finance-dashboard.local | AnalystPassword123 | Full access to analyst features |
| ADMIN | admin@finance-dashboard.local | AdminPassword123 | Full access to all features |
| INACTIVE | inactive@finance-dashboard.local | InactivePassword123 | Login denied (test for error handling) |

**Benefits:**
- No signup required
- Immediate access to all functionality
- Test multiple role levels by switching accounts
- Reserved emails cannot be reused via signup

### User Signup (Long-Term Use)
**How to Use:**
1. Visit the login page
2. Click "Sign Up" tab
3. Enter name, email, password
4. Click "Sign Up"
5. Auto-logged in as VIEWER role

**Signup Flow:**
1. User provides name, email, password
2. Email is validated and normalized (lowercase)
3. Password is hashed with bcryptjs (10 rounds)
4. User created with default role (VIEWER)
5. JWT token issued for immediate login
6. Frontend auto-logs in user and redirects to dashboard

**Limitations:**
- Cannot select role at signup (always VIEWER)
- Contact admin to upgrade role to ANALYST or ADMIN
- Demo email accounts cannot be registered

## Role-Based Access Control (RBAC)

| Role | Features | API Access |
|------|----------|----------|
| VIEWER | View dashboard summary, view records | Read-only query endpoints, full dashboard access |
| ANALYST | VIEWER + create/edit records | VIEWER access + write endpoints for records |
| ADMIN | ANALYST + user management | All endpoints including user management |

Each API endpoint checks the user's role and enforces access control automatically.

## Security Considerations

### Password Security
- **Minimum Length**: 8 characters (enforced at signup)
- **Hashing**: bcryptjs with 10 salt rounds
- **Storage**: Never stored in plain text; always hashed
- **Never Transmitted**: Password only sent during login/signup, never in responses

### Token Security
- **Format**: JWT with HMAC-SHA256
- **Storage**: Client-side `localStorage`
- **Transmission**: HTTP `Authorization: Bearer` header
- **Validation**: Checked on every protected endpoint
- **HTTPS**: Recommended for production (CORS configured in backend)

### Rate Limiting
- **Login Endpoint**: 5 attempts/15 min per IP (blocks brute-force)
- **Signup Endpoint**: 10 attempts/1 hour per IP (prevents abuse)
- **Successful Requests**: Do not count toward limit
- **Implementation**: express-rate-limit middleware

### CORS Configuration
- **Default Development**: `http://localhost:5500`
- **Configurable**: Via `CORS_ORIGIN` environment variable
- **Production**: Should restrict to frontend domain only

## Environment Configuration

Configure the backend via `.env` file:

```
# Server and database
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/finance_dashboard

# Authentication secret (used for JWT signing)
JWT_SECRET=your-secure-random-secret-key-change-in-production

# CORS (for frontend development)
CORS_ORIGIN=http://localhost:5500

# Test environment
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/finance_dashboard_test
```

**Important for Production:**
- `JWT_SECRET` must be a strong, random value (minimum 32 characters recommended)
- Never commit `.env` to version control
- Use environment variable injection in production instead of `.env` file
- Rotate `JWT_SECRET` periodically (requires token refresh)

## Common Workflows

### 1. Evaluator Workflow (Demo Access)
```
1. User visits login page
2. Click "Sign In" → demo cards visible
3. Select demo account (e.g., Viewer)
4. Auto-filled email/password
5. Click "Login"
6. JWT token issued
7. Auto-redirect to dashboard
8. All features available for that role
```

### 2. New User Signup Workflow
```
1. User visits login page
2. Click "Sign Up" tab
3. Enter name, email, password
4. Click "Sign Up"
5. User created with VIEWER role, ACTIVE status
6. JWT token issued
7. Auto-redirect to dashboard
8. View-only access; contact admin for role upgrade
```

### 3. Admin User Management (Future)
```
1. Admin accesses user management API
2. Can change user role to ANALYST or ADMIN
3. Can deactivate users (status = INACTIVE)
4. Inactive users cannot login
```

## Testing Authentication

### Run Auth Tests
```bash
cd backend
npm test -- tests/integration/auth.test.ts
```

### Manual Testing

**Login via curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance-dashboard.local",
    "password": "AdminPassword123"
  }'
```

**Signup via curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Get current user (requires token):**
```bash
TOKEN="<paste-token-from-login-or-signup>"
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### "User not found. Please sign up first."
**Cause:** Email doesn't exist in the database.
**Solution:** Either create a new account via signup or use a demo email.

### "Incorrect password. Please try again."
**Cause:** Password doesn't match the stored hash.
**Solution:** Verify password spelling (case-sensitive) or reset via admin.

### "Account is inactive. Contact support."
**Cause:** User exists but status is INACTIVE.
**Solution:** Contact admin to reactivate account. Use demo account to test this scenario.

### "Email address is already in use"
**Cause:** Signup attempted with an email already registered.
**Solution:** Use a different email or login if you already have an account.

### "This email address is reserved for demo access"
**Cause:** Attempted to signup with a demo email.
**Solution:** Use a different email. Demo accounts are reserved for evaluation.

### "Too many login attempts..."
**Cause:** More than 5 failed login attempts in 15 minutes from this IP.
**Solution:** Wait 15 minutes and try again, or contact admin to reset rate limit logs.

### "Too many signup attempts..."
**Cause:** More than 10 signup attempts in 1 hour from this IP.
**Solution:** Wait 1 hour and try again.

### "Authentication required" or "401 Unauthorized"
**Cause:** Missing or invalid token in request.
**Solution:**
1. Check that `Authorization: Bearer <token>` header is present
2. Verify token format is correct (should be three parts separated by dots)
3. Re-login to get a fresh token
4. Check token hasn't expired (if expiration implemented)

## Frontend Integration

The frontend implements a tab-based login/signup UI:

**Sign In Tab (Default):**
- Email and password inputs
- Demo account cards (Viewer, Analyst, Admin, Inactive)
- "Login" button
- "Don't have an account? Sign up" link

**Sign Up Tab:**
- Name, email, password inputs
- "Sign up" button  
- "Already have an account? Sign in" link
- No demo cards

**Auto-Login Behavior:**
- Both login and signup endpoints return `{ user, token }`
- Frontend stores token in `localStorage`
- Frontend sets `Authorization` header for all subsequent requests
- Frontend auto-redirects to dashboard on success

See `frontend/page-login.js` for implementation details.

## Related Documentation

- [User Model](../docs/user-model.md) - User entity definition
- [Role-Based Access Control](../docs/permission-matrix.md) - RBAC implementation
- [API Conventions](../docs/api-conventions.md) - General API guidelines
- [Error Handling](../docs/response-design.md) - Error response format

## Summary

The Hybrid Demo + Authentication System provides:
- ✅ Demo access for evaluators without signup friction
- ✅ User signup for long-term usage (default VIEWER role)
- ✅ Differentiated login error messages for better UX
- ✅ Reserved demo emails to prevent conflicts
- ✅ Rate-limited endpoints to prevent abuse
- ✅ Stateless JWT tokens for scalability
- ✅ Role-based access control for fine-grained permissions

This hybrid approach balances immediate evaluation access with long-term user account support.
