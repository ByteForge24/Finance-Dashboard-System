# Production Playwright Tests

This folder is a self-contained production monitoring harness for the deployed Finance Dashboard:

- Frontend: `https://finance-dashboard-pro.netlify.app`
- Backend: `https://finance-dashboard-api-hqjk.onrender.com`

Everything related to E2E test suite lives inside this root `tests/` folder only.

## What it covers

### Safe by default (read-only, no data mutation):
- **Frontend**:
  - Login page (auth flows, demo buttons, tab switching)
  - Dashboard (page load, filters, category navigation, trends, insights)
  - Records (viewing, filtering, pagination, RBAC enforcement)
  - Users (viewing, search, RBAC enforcement)
  - Settings (preferences, persistence)
  - Authorization (unauthorized page, role-based access)
  - Mobile viewport smoke tests (core flows)

- **Backend / API**:
  - Auth endpoints (login, signup, me, token validation)
  - Health & security headers (CORS, CSP, X-Frame-Options, etc.)
  - Dashboard APIs (summary, trends, category breakdown, monthly insights)
  - Records read operations, filters, pagination
  - RBAC enforcement (viewer, analyst, admin roles)
  - Database consistency checks (totals align, categories match)
  - Category suggestions

### Optional write suites (behind environment flags):
- **Record CRUD** (`ALLOW_PRODUCTION_WRITES=true`):
  - Create, read, update, delete records
  - Soft-delete behavior
  - Verify 404 or deletedAt after deletion
  - Test with unique identifiers to avoid conflicts

- **User Management** (`ALLOW_PERSISTENT_PROD_USER_TESTS=true`):
  - Get user by ID
  - Patch user role
  - Patch user status
  - Verify RBAC prevents analyst modifications

- **Rate Limit Tests** (`ENABLE_RATE_LIMIT_CHECKS=true`):
  - Signup failure scenarios (reserved email)
  - Login failure scenarios (wrong password, user not found)
  - Does NOT intentionally trigger rate limits by default

## Safety model

The default suite is production-safe and read-only.

- It does **not** create users
- It does **not** create permanent records
- It does **not** trigger rate-limit lockouts on purpose
- It skips negative login/signup assertions unless `ENABLE_RATE_LIMIT_CHECKS=true`
- It uses unique timestamps for test records to avoid conflicts

Opt-in suites (behind env flags) perform targeted mutations:
- `ALLOW_PRODUCTION_WRITES=true`: Record create/update/delete (cleaned up after each test)
- `ALLOW_PERSISTENT_PROD_USER_TESTS=true`: User role/status changes (be careful as there is no delete-user endpoint)
- `ENABLE_RATE_LIMIT_CHECKS=true`: Login/signup error scenarios (consumes rate limit budget)

## Install

From the repo root:

```bash
cd tests
npm install
```

If Playwright asks for a browser install, run:

```bash
npx playwright install chromium
```

## Run

### Safe production monitoring (default):

Headless (fastest):
```bash
npm run test:safe
```

Visual with browser and slowMo (recommended for debugging):
```bash
npm run test:safe:headed
```

### Headed serial mode (watch the browser do the work):

Safe suite in headed serial mode (one test at a time, visible browser):
```bash
npm run test:safe:headed
```

All tests (safe + optional if env flags set) in headed serial mode with slowMo:
```bash
npm run test:headed:serial
```

### Specific test suites:

Frontend only:
```bash
npm run test:spec -- e2e/frontend*.spec.ts
```

Run a specific test file with your own slowMo:
```bash
PLAYWRIGHT_SLOW_MO=500 npm run test:spec -- e2e/frontend-dashboard-detailed.spec.ts
```

API security only:
```bash
npm run test:spec -- e2e/api-security-and-integrity.spec.ts
```

### Opt-in write suites:

**Record CRUD** (creates and deletes test records):
```bash
npm run test:records
```

**User management** (modifies user roles/status):
```bash
npm run test:user-mgmt
```

**All production writes**:
```bash
npm run test:writes
```

**Rate limit checks** (consumes login/signup failure budget):
```bash
npm run test:ratelimit
```

### Debug & reporting:

Debug mode (pause and inspect):
```bash
npm run test:debug
```

List all tests without running:
```bash
npm run test:list
```

View HTML report:
```bash
npm run test:report
```

## Environment knobs

- `PROD_FRONTEND_URL`: override the frontend base URL (default: https://finance-dashboard-pro.netlify.app)
- `PROD_BACKEND_URL`: override the backend base URL (default: https://finance-dashboard-api-hqjk.onrender.com)
- `PLAYWRIGHT_HEADED=true`: run with a visible browser
- `PLAYWRIGHT_SLOW_MO=250`: slow down actions for visual demos (milliseconds)
- `ALLOW_PRODUCTION_WRITES=true`: enable record create/update/delete tests
- `ALLOW_PERSISTENT_PROD_USER_TESTS=true`: enable user role/status modification tests
- `ENABLE_RATE_LIMIT_CHECKS=true`: enable rate-limit-consuming auth failure tests

## Test files

| File | Scope | Mutates | Notes |
|---|---|---|---|
| `frontend-auth-and-rbac.spec.ts` | Login, RBAC enforcement, auth flows | No | Core auth tests |
| `frontend-dashboard-detailed.spec.ts` | Dashboard layout, filters, navigation | No | New: dashboard UX coverage |
| `frontend-records-detailed.spec.ts` | Records table, filters, pagination, RBAC | No | New: records UX coverage |
| `frontend-ux-and-mobile.spec.ts` | Tab switching, users search, mobile viewport | No | New: UX polish + mobile |
| `api-security-and-integrity.spec.ts` | API endpoints, RBAC, data consistency | No | API contract validation |
| `production-writes.optional.spec.ts` | Record create/edit/delete | ✅ Yes (cleaned up) | Original opt-in write suite |
| `backend-user-management.optional.spec.ts` | User endpoints, role/status | ✅ Yes | New: user CRUD tests |
| `backend-record-lifecycle.optional.spec.ts` | Record CRUD with full lifecycle | ✅ Yes | New: record lifecycle tests |

## Coverage matrix

See [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md) for a detailed breakdown of:
- Frontend routes and visual coverage
- Backend endpoints
- Auth scenarios
- RBAC enforcement
- Security checks
- Database consistency
- What is currently covered vs. missing
- What is safe to automate vs. requires opt-in

## Example workflows

### 1. Daily monitoring (safe, fast):
```bash
npm run test:safe
```

### 2. Pre-deployment validation (safe, visible):
```bash
npm run test:safe:headed
```

### 3. Weekly data mutation tests (careful, one-by-one):
```bash
ALLOW_PRODUCTION_WRITES=true PLAYWRIGHT_SLOW_MO=500 npm run test:headed:serial
```

### 4. Verify a specific feature (visible, slow):
```bash
PLAYWRIGHT_SLOW_MO=1000 npm run test:spec -- e2e/frontend-dashboard-detailed.spec.ts
```

### 5. Full regression (after each deploy):
```bash
npm run test:safe:headed
npm run test:report
```

## Notes from live inspection

- The deployed backend health route responds successfully at `/health/`
- The deployed backend returns `401` for `GET /api/v1/auth/me` without a token
- The live app currently exposes seeded demo accounts for `viewer`, `analyst`, `admin`, and `inactive`
- The live health response reports `db: "connected"`, confirming Supabase connectivity
- Frontend uses hash-based routing (`/#/dashboard`, `/#/records`, etc.)
- Session token stored in localStorage; no persistent backend sessions

## Troubleshooting

**Tests fail locally but pass in CI?**
- Check `PROD_FRONTEND_URL` and `PROD_BACKEND_URL` environment variables
- Ensure Playwright browsers are installed: `npx playwright install`
- Check firewall/proxy blocking access to production URLs

**"Address already in use" error?**
- Tests target production URLs, not localhost
- If you see this locally, check for stray processes

**Rate limit errors in tests?**
- Default suite skips rate-limit-consuming tests
- To run them: `ENABLE_RATE_LIMIT_CHECKS=true npm run test:ratelimit`
- Be aware this consumes your rate limit budget

**"Cannot find module" errors?**
- Run `npm install` in the `tests/` folder
- Ensure `@playwright/test` is installed: `npm ls @playwright/test`

