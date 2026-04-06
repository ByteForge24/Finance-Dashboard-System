# Local Development Setup

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ running locally
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and set your `DATABASE_URL` to point to your local PostgreSQL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard_dev"
JWT_SECRET="dev-secret-key-change-in-production"
PORT=3000
```

### 3. Set Up Database

Run migrations and seed the database:

```bash
npm run db:migrate
npm run db:seed
```

Or use the setup shortcut:

```bash
npm run setup
```

This runs: `npm install && npm run db:migrate && npm run db:seed`

## Common Commands

### Development Server

```bash
npm run dev
```

Runs the server with hot reload on `http://localhost:3000`

### Database Migrations

```bash
npm run db:migrate
```

### Seed Database

```bash
npm run db:seed
```

Creates test users and sample data.

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

```bash
npm run test:cov
```

### Smoke Tests

```bash
npm run smoke
```

Verifies all major endpoints and permissions are working.

## Testing the API

Once the server is running, test endpoints:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance-dashboard.local","password":"AdminPassword123"}'
```

See [openapi.yaml](./openapi.yaml) for complete API documentation.

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and `DATABASE_URL` is correct. Test the connection:

```bash
psql $DATABASE_URL
```

### Migrations Not Applying

Clear Prisma cache:

```bash
rm -rf node_modules/.prisma
npm install
npm run db:migrate
```

### Port Already in Use

Change the PORT in `.env`:

```
PORT=3001
```

Then restart the dev server.

## Next Steps

- Read [openapi.yaml](./openapi.yaml) for complete API documentation
- Check [../docs/permission-matrix.md](../permission-matrix.md) for role definitions
- Run smoke tests: `npm run smoke`
