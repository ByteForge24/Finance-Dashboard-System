# Local Development Setup

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL 12+

## Setup Steps

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your database connection:
```
DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard_dev"
JWT_SECRET="dev-secret-key"
PORT=3000
CORS_ORIGIN="http://localhost:5500"
```

3. (Optional) Configure OpenAI for AI-powered category suggestions:
```
OPENAI_API_KEY="sk-your-api-key"
OPENAI_MODEL="gpt-4-mini"
OPENAI_TIMEOUT_MS="3000"
```
Note: If not provided, the system automatically uses keyword-based suggestions.

4. Install and initialize:
```bash
npm run setup
```

This runs: `npm install && npm run db:migrate && npm run db:seed`

## Development

Start development server with hot reload:
```bash
npm run dev
```

## Database

Run migrations:
```bash
npm run db:migrate
```

Seed initial data:
```bash
npm run db:seed
```

## Testing

Run all tests:
```bash
npm run test
```

Run smoke tests:
```bash
npm run smoke
```
