# Finance Dashboard Backend

RESTful API backend for the Finance Dashboard System built with Node.js, TypeScript, and Express.

## Key Features

- **Hybrid Demo + Authentication System**: Demo accounts for immediate evaluation + user signup for long-term access
- **User Signup**: New users self-register with default VIEWER role
- **Differentiated Login Errors**: Clear error messages for better user experience
- **Role-Based Access Control**: VIEWER, ANALYST, ADMIN roles with granular permissions
- **Financial Record Management**: Create, query, and aggregate financial data
- **Dashboard Analytics**: Summary statistics, trends, category breakdowns, insights
- **Rate Limiting**: Brute-force protection (5 login/15min, 10 signup/1hr)
- **JWT Authentication**: Stateless token-based authentication

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

## Installation

```bash
npm install
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm test` - Run all backend tests
- `npm run clean` - Remove dist directory

## Development

Start the development server:

```bash
npm run dev
```

The server runs on `http://localhost:3000` by default.

Check health status:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "finance-dashboard-backend"
}
```

## Authentication

The system provides a hybrid authentication model:

### Demo Access (Evaluator Flow)
Use demo accounts without signup:
- admin@finance-dashboard.local / AdminPassword123 (ADMIN role)
- analyst@finance-dashboard.local / AnalystPassword123 (ANALYST role)
- viewer@finance-dashboard.local / ViewerPassword123 (VIEWER role)

### User Signup
New users can register via `POST /api/v1/auth/signup`:
- Email validation and normalization
- Password hashing with bcryptjs
- Auto-assigned VIEWER role and ACTIVE status
- Returns JWT token for immediate login

### Login
`POST /api/v1/auth/login` with differentiated error messages:
- "User not found. Please sign up first."
- "Incorrect password. Please try again."
- "Account is inactive. Contact support."

**Full documentation**: See [AUTHENTICATION.md](./docs/AUTHENTICATION.md)

## Project Structure

```
src/
|-- app.ts                     Express app configuration
|-- server.ts                  Server entry point
|-- routes/                    API route handlers
|-- modules/
|   |-- auth/                  Authentication (login, signup, tokens)
|   |-- users/                 User management business logic
|   |-- records/               Financial records management
|   `-- dashboard/             Dashboard summary aggregation
|-- shared/
|   |-- domain/                Core entity definitions (User, FinancialRecord, Role, enums)
|   |-- access-control/        Role-based access control
|   |-- middleware/            Express middleware (auth, rate limiting, CORS)
|   |-- errors/                Error handling and codes
|   |-- validators/            Input validation schemas
|   `-- utils/                 Utility functions
`-- config/                    Configuration and environment
```

## Environment Configuration

Create a `.env` file in the backend root to configure the server:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/finance_dashboard
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5500
```

**For testing**, create `.env.test`:
```
NODE_ENV=test
DATABASE_URL=postgresql://user:password@localhost:5432/finance_dashboard_test
JWT_SECRET=test-secret-key
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/signup` - Create new user account
- `GET /api/v1/auth/me` - Get current user (requires token)

### Financial Records
- `GET /api/v1/records` - List user's records
- `POST /api/v1/records` - Create record
- `PATCH /api/v1/records/:id` - Update record
- `DELETE /api/v1/records/:id` - Delete record

### Dashboard
- `GET /api/v1/dashboard/summary` - Aggregated summary
- `GET /api/v1/dashboard/trends` - Trends over time
- `GET /api/v1/dashboard/categories` - Category breakdown
- `GET /api/v1/dashboard/monthly-insights` - Monthly insights

### User Management (Admin only)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
```

### Optional: AI Category Suggestions

The backend includes an optional AI-powered category suggestion feature that helps users categorize transactions.

**With OpenAI (recommended):**
```
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-mini
OPENAI_TIMEOUT_MS=3000
```

**Without OpenAI (fallback):**
If `OPENAI_API_KEY` is not provided, the system automatically uses deterministic keyword-based suggestions. The backend will start successfully and the suggestion endpoint will still function.

**Endpoint:**
- `POST /api/v1/records/suggest-category` - Suggest a category for a transaction

**Request:**
```json
{
  "notes": "grocery shopping at whole foods",
  "type": "expense",
  "amount": 127.45
}
```

**Response:**
```json
{
  "suggestedCategory": "Groceries",
  "alternatives": ["Food", "Shopping"],
  "confidence": "high",
  "source": "ai"
}
```

**Permissions:**
- Admin: ✅
- Analyst: ✅
- Viewer: ❌

## Building for Production

```bash
npm run build
npm start
```

The compiled output is in the `dist/` directory.
