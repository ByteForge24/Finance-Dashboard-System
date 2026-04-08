# Finance Dashboard System

> A backend-focused financial management application providing RESTful APIs for user authentication, financial record management, and dashboard analytics with role-based access control.

## Project Overview

Finance Dashboard System is designed with a backend-first approach. The backend delivers comprehensive financial record management, role-based access control (Viewer, Analyst, Admin), and aggregated dashboard analytics. The system enforces data integrity through PostgreSQL, validates all inputs through a centralized validation layer, and provides type-safe operations via TypeScript and Prisma.

**Current Status**: 
- ✅ Backend implementation complete
- ✅ Hybrid Demo + Authentication System complete (Phase 9)
  - Demo access for evaluators without signup friction
  - User signup with default VIEWER role
  - Differentiated login error messages  
  - Reserved demo emails for protected accounts
  - Rate-limited endpoints (5 login/15min, 10 signup/1hr)
- ✅ Backend API contract frozen
- ✅ Frontend design specification frozen
- ⏳ Frontend implementation ready to begin

## Technology Stack

The backend uses a modern, proven technology stack optimized for rapid API development and maintainability:

- **Runtime & Language**: Node.js with TypeScript for type safety and explicit code structure
- **Framework**: Express for lightweight, unopinionated HTTP API handling
- **Database**: PostgreSQL for reliable relational data storage and complex aggregations
- **ORM**: Prisma for type-safe database access, automatic migrations, and schema validation
- **Validation**: Custom validation layer with typed validator functions
- **Authentication**: JWT (HMAC-SHA256) for stateless token-based authentication
- **Testing**: Jest + Supertest for unit and integration testing
- **Documentation**: OpenAPI specification via code annotations

**Why this stack**: Each choice prioritizes code clarity and auditability. TypeScript provides compile-time safety; custom validators provide runtime checks. Express keeps business logic explicit and auditable. Prisma eliminates SQL boilerplate while maintaining type safety. PostgreSQL supports complex financial queries and enforces data integrity through constraints.

## Project Structure

```
finance-dashboard-system/
├── backend/                    # Backend API implementation
│   ├── src/
│   │   ├── app.ts             # Express app setup
│   │   ├── server.ts          # Server entry point
│   │   ├── config/            # Database and auth configuration
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── users/         # User management module
│   │   │   ├── records/       # Financial records module
│   │   │   └── dashboard/     # Dashboard summary module
│   │   ├── routes/            # API route definitions
│   │   └── shared/            # Shared middleware, errors, utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding script
│   ├── tests/                 # Integration and unit tests
│   ├── scripts/               # Utility scripts (smoke tests)
│   ├── docs/                  # API documentation (OpenAPI)
│   ├── package.json           # Dependencies and scripts
│   ├── tsconfig.json          # TypeScript configuration
│   ├── jest.config.js         # Test configuration
│   ├── SETUP.md               # Detailed setup instructions
│   ├── TEST_SETUP.md          # Testing setup guide
│   └── README.md              # Backend-specific documentation
├── frontend/                  # Frontend (not yet implemented)
├── docs/                      # Shared project documentation
│   ├── tech-stack.md          # Technology stack justification
│   ├── assumptions.md         # Design assumptions and constraints
│   ├── success-criteria.md    # Acceptance criteria for MVP
│   ├── permission-matrix.md   # Role-based access control spec
│   ├── user-model.md          # User entity documentation
│   ├── financial-record-model.md # Financial record entity docs
│   ├── domain-entities.md     # All domain model definitions
│   └── [other docs]           # Additional documentation files
└── README.md                  # This file
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 12+

### Backend Setup (5 minutes)

1. Navigate to the backend:
```bash
cd backend
```

2. Copy environment template and configure:
```bash
cp .env.example .env
nano .env  # Edit with your database URL and JWT secret
```

3. Run setup (installs dependencies, runs migrations, seeds database):
```bash
npm run setup
```

4. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

### Environment Variables

Required configuration in `.env`:

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/finance_dashboard_dev` | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-key-change-in-production` | Secret for JWT signing/verification |
| `PORT` | `3000` | Server port (optional, defaults to 3000) |

For local development, `.env.example` provides sensible defaults. Production deployments must use strong secrets and production database credentials.

## Development Commands

All commands run from the `backend/` directory:

| Command | Purpose |
|---|---|
| `npm run setup` | Initial setup: install dependencies + migrate database + seed data |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled server |
| `npm test` | Run all unit and integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run smoke` | Run smoke tests (basic API functionality check) |
| `npm run db:migrate` | Create/apply database migrations |
| `npm run db:seed` | Populate database with seed data |
| `npm run clean` | Remove compiled output directory |

## Database Setup

### Schema

The database consists of three core entities:

**Users Table**
- `id` (UUID, primary key)
- `email` (string, unique)
- `password` (string, bcrypt hashed)
- `role` (enum: VIEWER, ANALYST, ADMIN)
- `status` (enum: ACTIVE, INACTIVE)
- `createdAt`, `updatedAt` (timestamps)

**Financial Records Table**
- `id` (UUID, primary key)
- `amount` (decimal)
- `type` (enum: INCOME, EXPENSE)
- `category` (string)
- `date` (date)
- `notes` (string, optional)
- `createdAt`, `updatedAt` (timestamps)
- `deletedAt` (timestamp, nullable) — Soft delete timestamp; null = active record, non-null = record is deleted

**See [docs/domain-entities.md](docs/domain-entities.md) for complete schema and relationships.**

### Data Management: Soft Delete

Financial records use **soft delete** (logical deletion) instead of permanent removal. When a record is deleted:

- The record is marked with a `deletedAt` timestamp
- The record is **excluded from all normal operations**: GET, PATCH, list queries, and dashboard analytics
- Attempting to access a deleted record (`GET /api/v1/records/{id}`) returns **404 Not Found**
- Attempting to update a deleted record (`PATCH /api/v1/records/{id}`) returns **404 Not Found**
- Attempting to delete an already-deleted record returns **404 Not Found**
- Dashboard endpoints (summary, category breakdown, recent activity, trends) **exclude soft-deleted records** from their calculations and results

This approach preserves data history and referential integrity while maintaining the user-facing illusion of permanent deletion.

### Migrations

Migrations are version-controlled in the `prisma/` directory. To apply pending migrations:

```bash
npm run db:migrate
```

To create a new migration after schema changes:
```bash
npm run db:migrate  # Prompts for migration name
```

### Seeding

Initial data is seeded in `/prisma/seed.ts`. Seed runs automatically as part of `npm run setup`. To manually re-seed:

```bash
npm run db:seed
```

Default seed data includes test users (Viewer, Analyst, Admin) and sample financial records for manual testing.

## API Structure

All API endpoints are prefixed with `/api/v1`.

### Route Groups

| Route | Purpose | Module |
|---|---|---|
| `/api/v1/auth` | User authentication (login, token validation) | auth |
| `/api/v1/users` | User management (create, list, update, manage roles) | users |
| `/api/v1/records` | Financial record CRUD | records |
| `/api/v1/dashboard` | Dashboard summaries and analytics | dashboard |

### Request/Response Format

All requests and responses use JSON.

**Success Response (200 OK, 201 Created)**
Returns the entity or array of entities directly. List endpoints vary by resource:
- Users list: `{ data: [...], count: N }`
- Records list: `{ data: [...], pagination: { page, limit, total, totalPages, hasNextPage, hasPreviousPage } }`
- Dashboard endpoints: Custom structures (e.g., `{ data: [...], period?: {...} }` for breakdowns) or raw aggregates for summaries

**Error Response (4xx, 5xx)**
```json
{
  "error": "ValidationError",
  "message": "Email is invalid",
  "details": [{ "field": "email", "issue": "Invalid format" }]
}
```
The `details` array is present only for validation errors.

### Authentication

All endpoints except `/api/v1/auth/login` require authentication. Include JWT token in `Authorization` header:

```bash
Authorization: Bearer <token>
```

Invalid or missing tokens return `401 Unauthorized`.

### Core Endpoints

**Authentication**
- `POST /api/v1/auth/login` - Exchange email/password for JWT token
- `GET /api/v1/auth/me` - Get current authenticated user info

**User Management** (Admin only)
- `POST /api/v1/users` - Create new user
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - View user details
- `PATCH /api/v1/users/:id` - Update user info
- `PATCH /api/v1/users/:id/role` - Change user role
- `PATCH /api/v1/users/:id/status` - Activate/deactivate user

**Financial Records** (Admin creates/updates/deletes; Analyst/Admin read)
- `POST /api/v1/records` - Create record (Admin only)
- `GET /api/v1/records` - List records (queryable by date, category, type)
- `GET /api/v1/records/:id` - View record details
- `PATCH /api/v1/records/:id` - Update record (Admin only)
- `DELETE /api/v1/records/:id` - Delete record (Admin only)

**Dashboard** (All authenticated users)
- `GET /api/v1/dashboard/summary` - Total income, expenses, net balance
- `GET /api/v1/dashboard/category-breakdown` - Income/expense totals by category
- `GET /api/v1/dashboard/recent-activity` - Last N records
- `GET /api/v1/dashboard/trends` - Monthly/weekly income vs expense trends

**See [docs/openapi.yaml](backend/docs/openapi.yaml) for complete endpoint specification.**

## Role-Based Access Control

The system implements three roles with strictly defined permissions. All access control is role-based; there is no per-user record ownership or team-based isolation.

### Roles

**Viewer** (Read-only dashboard access)
- Can view dashboard summaries (totals, trends, category breakdowns, recent activity)
- Cannot access financial records
- Cannot manage users
- Ideal for stakeholders or managers with visibility needs but no operational responsibilities

**Analyst** (Read-only records access)
- Can view all financial records and apply filters
- Can view all dashboard endpoints
- Cannot create, update, or delete records
- Cannot manage users
- Ideal for finance teams, auditors, or reporting specialists

**Admin** (Full system control)
- Can create, read, update, delete financial records
- Can create users, update user information, assign roles, activate/deactivate accounts
- Can access all dashboard endpoints
- Ideal for system administrators and financial managers

### Permission Matrix

See the complete permission matrix in [docs/permission-matrix.md](docs/permission-matrix.md).

### Implementation Notes

- Role is determined from JWT token payload on every request
- Access control is enforced via middleware before handler execution
- Insufficient role returns `403 Forbidden` with message
- Inactive users cannot authenticate; login returns `401 Unauthorized`
- No special cases or exceptions to the matrix are implemented in MVP

## Design Assumptions

The system makes intentional simplifications to stay focused on core functionality:

**Functional Scope**
- Single role per user (no multiple roles or delegated permissions)
- Role-based global access (no per-record ownership or team isolation)
- Hard delete only (no soft delete/archival in MVP)
- Two transaction types only: INCOME and EXPENSE (no investment, loan, or other types)
- Paginated record listing (default 20 per page, configurable 1–100)

**User Lifecycle**
- Users are created by Admins or during setup (no self-registration)
- No "forgot password" feature (Admin resets passwords manually)
- User deletion is deactivation (toggle active/inactive status)

**Financial Data**
- Monetary amounts use numeric storage with implementation-defined precision
- Categories are free-text strings (no predefined enum)
- Descriptions/notes are optional; amount, type, category, date are required
- Dashboard calculations run on-demand (no caching required for MVP)

**Architecture**
- REST API only (no GraphQL or other styles)
- Stateless authentication (JWT, no sessions)
- Single database instance (no replication or sharding)
- No real-time updates (polling or POST-based only)

**See [docs/assumptions.md](docs/assumptions.md) for complete design rationale and tradeoffs.**

## Tradeoffs and MVP Decisions

**Explicit over Implicit**
- Express (not NestJS) to keep routing and business logic visible
- No auto-generated CRUD endpoints; all handlers are explicit and auditable
- Validation errors include field names and reasons (not generic messages)

**Simplicity over Scale**
- Hart delete, not soft delete, to avoid tombstone queries
- Global role-based access, not per-resource permissions (easier to implement and audit)
- On-demand dashboard calculation, not cached aggregates (sufficient for MVP scale)

**Type Safety over Flexibility**
- TypeScript + custom validators catch errors before runtime
- Fixed schema through Prisma (easier to reason about than schemaless storage)
- Enum role and transaction type (prevents invalid states at database level)

**Standard Patterns over Custom Solutions**
- JWT over custom token implementation
- bcrypt over custom password hashing
- Prisma over raw SQL (ORM patterns familiar to most developers)

These tradeoffs represent a deliberate choice to optimize for code clarity, time-to-delivery, and assessment appropriateness over production scale or boutique features.

## Testing

### Running Tests

All tests are located in `backend/tests/`.

```bash
npm test                # Run all tests once
npm run test:watch     # Run in watch mode (re-run on file changes)
npm run test:cov       # Run with coverage report
npm run smoke          # Run smoke tests (quick system check)
```

### Test Structure

**Unit Tests** (`tests/unit/`)
- Test individual functions and utilities
- Example: `date-utilities.test.ts`

**Integration Tests** (`tests/integration/`)
- Test API endpoints end-to-end with real database
- Example: `auth.test.ts`, `records.test.ts`, `dashboard.test.ts`

### Coverage

Coverage reports are generated in `backend/coverage/`. View the HTML report:
```bash
npm run test:cov
open coverage/lcov-report/index.html  # macOS
# or
xdg-open coverage/lcov-report/index.html  # Linux
```

## Documentation

Complete documentation is available in the `docs/` directory:

| File | Purpose |
|---|---|
| [frontend-api-contract.md](docs/frontend-api-contract.md) | Stable API contracts for frontend consumption (request/response shapes, auth flow, role visibility) |
| [frontend-stitch-plan.md](docs/frontend-stitch-plan.md) | Design-first frontend specification (screens, navigation, design system, wireframes, state handling) |
| [tech-stack.md](docs/tech-stack.md) | Justification for each technology choice and alternatives considered |
| [assumptions.md](docs/assumptions.md) | Design assumptions and intentional simplifications |
| [permission-matrix.md](docs/permission-matrix.md) | Complete role-based access control specification |
| [domain-entities.md](docs/domain-entities.md) | Entity relationships and complete schema |
| [user-model.md](docs/user-model.md) | User entity details and lifecycle |
| [financial-record-model.md](docs/financial-record-model.md) | Financial record structure and validations |
| [success-criteria.md](docs/success-criteria.md) | MVP completion checklist and acceptance criteria |
| [openapi.yaml](backend/docs/openapi.yaml) | Complete OpenAPI specification for all endpoints |

## Common Development Tasks

### Debugging

Start server with debugger support:
```bash
node --inspect-brk -r tsx src/server.ts
```

Connect VS Code debugger or use browser DevTools.

### Adding a New Endpoint

1. Create route handler in appropriate module (`src/modules/[feature]/[feature].routes.ts`)
2. Add service logic in `src/modules/[feature]/[feature].service.ts`
3. Define types in `src/modules/[feature]/[feature].types.ts`
4. Add validation schemas if needed
5. Add integration test in `tests/integration/`
6. Update OpenAPI spec in `backend/docs/openapi.yaml`

### Running Specific Tests

```bash
npm test -- auth.test         # Run specific test file
npm test -- --testNamePattern="should login"  # Run tests matching pattern
```

### Database Connection Issues

If tests or server fail to connect to database:

1. Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Check `DATABASE_URL` in `.env` matches your setup
3. For local development, a simple valid URL is: `postgresql://postgres:password@localhost:5432/finance_dashboard_dev`
4. Ensure database exists or Prisma can create it

## Future Improvements

**Phase 2 (if continued)**
- Soft delete with audit trail for records and users
- Pagination for large result sets
- Filtering enhancements (combined filters, advanced queries)
- Caching strategy for dashboard endpoints (Redis or in-memory)
- Password reset via email
- Multi-factor authentication (optional)

**Phase 3 (frontend integration)**
- React or Vue frontend aligned with backend API contracts
- Real-time dashboard updates via WebSockets
- Advanced analytics and export functionality

**Production Readiness**
- Rate limiting and DDoS protection
- Comprehensive E2E test coverage
- Logging and monitoring infrastructure
- Database connection pooling
- API versioning strategy
- Blue-green deployment pipeline

## Contributing

Follow these conventions when contributing to the backend:

1. Run `npm run test` before submitting code
2. Ensure `npm run test:cov` shows adequate coverage
3. Follow existing code patterns (see modules for structure)
4. Keep files focused (50-150 lines preferred)
5. Add types to all function parameters and returns
6. Update relevant documentation when changing API contracts

## License

This is an assessment project.
