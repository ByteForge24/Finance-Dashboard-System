Use this exact prompt in Cursor:

```text
Inspect the entire Finance Dashboard project deeply before changing anything.

Project goals:
- Create a comprehensive Playwright production E2E + production API monitoring suite.
- Run against the REAL deployed production URLs, not localhost.
- Keep every testing-related file inside a single root-level tests/ folder only.
- After writing missing tests, execute them serially in headed mode so I can visually watch the browser open and perform each flow one by one.

Live production URLs:
- Frontend: https://finance-dashboard-pro.netlify.app/
- Backend: https://finance-dashboard-api-hqjk.onrender.com/

First step requirements:
1. Inspect the full repo first:
   - frontend routes and pages
   - backend Express routes
   - Prisma schema
   - auth flows
   - RBAC permissions
   - Supabase-related behavior and production safety constraints
2. Inspect any existing tests under tests/.
3. Build and print a coverage matrix with:
   - every frontend route/screen
   - every backend endpoint
   - whether it is already covered
   - what is still missing
   - whether it is safe to automate on production by default
4. Then implement all missing safe coverage.
5. Then implement opt-in coverage for production-persistent writes behind env flags.
6. Then execute the suite serially in headed mode so the browser is visibly shown doing the work.

Important safety rules:
- Default suite must be production-safe and read-only.
- Do not pollute production by default.
- Do not create permanent production users in the default suite.
- Do not intentionally burn login/signup rate limits in the default suite.
- Put any rate-limit-consuming negative auth tests behind ENABLE_RATE_LIMIT_CHECKS=true.
- Put any production write tests behind ALLOW_PRODUCTION_WRITES=true.
- Put any persistent production user lifecycle tests behind a stronger explicit opt-in flag like ALLOW_PERSISTENT_PROD_USER_TESTS=true because the API has no delete-user endpoint.
- If a production endpoint cannot be safely and cleanly tested automatically, explicitly mark it in the coverage matrix and isolate it behind a dedicated opt-in suite instead of pretending it is safely covered.

What must be covered

A. Frontend visual E2E coverage in headed browser
- login page loads
- manual credential login flow
- demo login buttons for viewer, analyst, admin
- inactive login failure UI
- unauthorized redirect behavior
- logout flow
- dashboard page loads
- dashboard refresh button
- dashboard timeframe filter options
- dashboard recent activity navigation into records edit route
- dashboard category breakdown navigation into filtered records
- records page loads
- records filters
- records pagination
- records read-only analyst behavior
- records admin create/edit/delete flow only in opt-in write suite
- category suggestion UI
- users page loads for admin
- users search flow
- create/edit/role/status user flows only in persistent opt-in suite because they write production data
- settings page loads
- settings preference persistence
- global search behavior
- unauthorized page “back to dashboard” flow
- mobile viewport smoke coverage for core routes

B. Backend/API endpoint coverage
- GET /health/
- POST /api/v1/auth/login
- POST /api/v1/auth/signup
- GET /api/v1/auth/me
- POST /api/v1/users
- GET /api/v1/users
- GET /api/v1/users/:id
- PATCH /api/v1/users/:id
- PATCH /api/v1/users/:id/role
- PATCH /api/v1/users/:id/status
- POST /api/v1/records
- GET /api/v1/records
- GET /api/v1/records/:id
- PATCH /api/v1/records/:id
- DELETE /api/v1/records/:id
- POST /api/v1/records/suggest-category
- GET /api/v1/dashboard/summary
- GET /api/v1/dashboard/category-breakdown
- GET /api/v1/dashboard/recent-activity
- GET /api/v1/dashboard/trends
- GET /api/v1/dashboard/monthly-insights

C. Auth coverage
- valid login for viewer, analyst, admin
- invalid token
- missing token
- session restore behavior in browser
- expired/invalid token redirect behavior if feasible
- inactive user behavior
- reserved demo email signup rejection
- duplicate signup rejection only in opt-in persistent-user suite if needed
- token response shape and sanitized user payload

D. Authorization coverage
- viewer allowed dashboard and blocked from records/users
- analyst allowed records read and blocked from users and writes
- admin allowed records/users access
- backend 401 vs 403 behavior

E. Security coverage
- CORS
- CSP / helmet-style security headers
- x-content-type-options
- x-frame-options or equivalent
- referrer-policy
- auth-protected endpoints reject missing/invalid token
- validation failure shapes on bad query/body input
- no password/passwordHash leakage in responses

F. Database / Supabase-backed verification through production contract
- health says DB connected
- dashboard summary totals are internally consistent
- category breakdown totals align with summary totals where appropriate
- trends net equals income minus expense
- recent activity items are unique and valid
- records pagination metadata is valid
- records filters/search actually constrain returned data
- monthly insights response is structurally valid and coherent
- category suggestion works against real production data
- opt-in record write suite verifies create, read-back, update, soft-delete, and post-delete 404

Implementation requirements
- Keep everything inside tests/ only.
- Use Playwright.
- Use serial execution for production runs.
- Add helpers/utilities for API login and browser login.
- Add README with exact install/run instructions.
- Add package scripts for:
  - headless safe run
  - headed serial run
  - headed serial per-spec run
  - opt-in write run
  - opt-in persistent user run
  - HTML report
- Add traces/videos/screenshots on failure.
- Prefer robust assertions that tolerate small production drift.
- If the live deployment differs from the repo, adjust assertions to the live deployment and document the drift.

Execution requirements after writing tests
1. Install test dependencies if needed.
2. Install Playwright Chromium if needed.
3. Run the safe production suite first in headed serial mode with visible browser and slowMo so I can watch it.
4. Execute specs one by one, not all at once.
5. Then, only if explicit env flags are set, run the write suites.
6. At the end, print:
   - coverage matrix
   - which tests passed
   - which tests were skipped for safety
   - which endpoints remain impossible to fully validate safely on production without a disposable environment

Current expectation:
- Do not stop at “some tests already exist”.
- Treat this as a gap-analysis plus completion task.
- Extend the existing tests/ suite rather than moving files elsewhere.
- The end result should feel close to exhaustive, with honest handling of endpoints that are unsafe to fully automate on a shared production database.
```
