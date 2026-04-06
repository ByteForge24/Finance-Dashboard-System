# Finance Dashboard Backend

RESTful API backend for the Finance Dashboard System built with Node.js, TypeScript, and Express.

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

## Project Structure

```
src/
|-- app.ts                     Express app configuration
|-- server.ts                  Server entry point
|-- routes/                    API route handlers
|-- modules/
|   |-- users/                 User management business logic
|   |-- auth/                  Authentication and login
|   |-- records/               Financial records management
|   `-- dashboard/             Dashboard summary aggregation
|-- shared/
|   |-- domain/                Core entity definitions (User, FinancialRecord, Role, enums)
|   |-- access-control/        Role-based access control
|   |-- middleware/            Express middleware
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
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5500
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
