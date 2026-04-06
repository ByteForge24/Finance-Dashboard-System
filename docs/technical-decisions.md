# Technical Decisions and Trade-offs

## Executive Summary

This document outlines the key technical decisions made for the Finance Dashboard System, including framework selections, architecture patterns, database strategy, and authentication approach. Each decision includes the reasoning, alternatives considered, and trade-offs accepted.

---

## 1. Backend Framework: Express.js + TypeScript

### Decision
Selected **Express.js** with **TypeScript** for the backend API.

### Reasoning
- **Lightweight & Minimal:** Express provides just enough structure without enforcing architectural patterns, allowing flexible module organization
- **Industry Standard:** Wide adoption means extensive documentation, community support, and easy developer onboarding
- **TypeScript Safety:** Compile-time type checking catches errors early (vs plain Node.js), improving production reliability
- **Performance:** Minimal overhead; fast request handling suitable for financial data operations
- **Middleware Ecosystem:** Rich middleware ecosystem (helmet for security, cors for CORS, rate-limit for protection)

### Alternatives Considered

| Framework | Pros | Cons | Why Not |
|-----------|------|------|---------|
| **NestJS** | Strong architecture, built-in DI | Heavyweight, steep learning curve, overkill for MVP | Too complex for MVP scope |
| **Fastify** | Faster than Express | Smaller ecosystem, fewer middleware options | Express ecosystem sufficient; performance not bottleneck |
| **Spring Boot (Java)** | Enterprise-grade, strong ORM | JVM startup time, verbose, overcomplicated | Wrong language for quick MVP |
| **Django (Python)** | Batteries included, ORM | Not ideal for real-time APIs, slower than Node | Performance requirements favor Node |

### Trade-offs
- **Flexibility vs Structure:** Express is unopinionated, requiring manual folder organization (accepted: project is small enough)
- **Framework Maturity:** Newer frameworks like Fastify are faster but Express ecosystem is more established (accepted: standard choice)

---

## 2. Frontend Architecture: Vanilla JavaScript (No Framework)

### Decision
Built frontend with **vanilla HTML/CSS/JavaScript** instead of React/Vue/Angular.

### Reasoning
- **No Build Process Complexity:** Static files deploy instantly to Netlify without build optimization needed
- **Zero Runtime Dependencies:** Smaller bundle size, faster page load, no version conflicts
- **Single Page Application:** Vanilla JS with dynamic DOM manipulation sufficient for dashboard scope
- **Clear Separation:** Frontend is purely static; backend handles all business logic
- **Deployment Simplicity:** Netlify serves files as-is; no build step or Node.js required

### Alternatives Considered

| Framework | Pros | Cons | Why Not |
|-----------|------|------|---------|
| **React** | Component reusability, large ecosystem | NPM dependencies, webpack complexity, 20+ library versions to manage | Overhead for MVP dashboard |
| **Vue** | Simpler learning curve, lightweight | Still requires build process, npm dependencies | Build complexity unnecessary |
| **Angular** | Full-featured framework | Heavyweight, steep learning curve, overcomplicated for dashboard | Way overkill for MVP |
| **Svelte** | Most efficient compiled output | Build required, smaller tooling ecosystem | Build complexity not needed |

### Trade-offs
- **Scalability vs Simplicity:** Vanilla JS is harder to scale to large SPAs (accepted: dashboard is limited scope)
- **Reusability vs Maintenance:** No components means code duplication possible (accepted: small codebase; refactoring easy if needed)
- **Developer Experience vs Speed:** Vanilla JS less ergonomic than React (accepted: delivered faster)

---

## 3. Database: Supabase (Managed PostgreSQL)

### Decision
Selected **Supabase** (managed PostgreSQL) for production database.

### Reasoning
- **SQL Standard:** PostgreSQL is industry standard for relational data (financial records fit perfectly)
- **Managed Service:** No DevOps overhead; automatic backups, SSL, scaling handled
- **Real-time Subscriptions:** Built-in real-time support for future dashboard updates (if needed)
- **Row-Level Security:** Built-in RLS policies for multi-tenant data (future feature)
- **Cost Effective:** Free tier sufficient for MVP; pay-as-you-go scaling
- **Enterprise Features:** JSONB, full-text search, window functions for complex reporting
- **Zero Configuration:** Automatic connection pooling, no database setup needed

### Alternatives Considered

| Database | Pros | Cons | Why Not |
|-----------|------|------|---------|
| **MongoDB** | Flexible schema, easy scaling | Not ideal for structured financial data, ACID concerns | SQL better for finance |
| **Firebase (NoSQL)** | Realtime, managed, easy auth | Vendor lock-in, pricing unpredictability, limited querying | Less control; SQL preferred |
| **Self-hosted PostgreSQL** | Full control, open source | DevOps overhead, backups, monitoring, scaling responsibility | Managed service frees up time |
| **AWS RDS** | Highly customizable | Complex AWS ecosystem, more expensive, more setup | Supabase simpler for MVP |
| **PlanetScale (MySQL)** | Good scaling, managed | MySQL not as feature-rich as PostgreSQL | PostgreSQL preferred |

### Trade-offs
- **Vendor Lock-in vs Simplicity:** Supabase is proprietary (accepted: can export PostgreSQL anytime)
- **Control vs Management:** Less control than self-hosted (accepted: managed simplicity worth it)
- **Pricing Transparency vs Cost:** Usage-based pricing (accepted: predictable for MVP)

---

## 4. Authentication: JWT (JSON Web Tokens)

### Decision
Selected **JWT** with **bcrypt password hashing** for stateless authentication.

### Reasoning
- **Stateless:** No server session storage needed; scales horizontally
- **Standard:** Industry standard for REST APIs; understood by all developers
- **Secure:** JWT tokens signed with secret; cannot be forged without secret key
- **Flexible:** Tokens include user role/permissions; backend can check without extra DB query
- **Mobile-Ready:** Tokens work seamlessly with mobile apps, SPAs, and third-party integrations

### Token Structure (JWT)
```
Header: {alg: "HS256", typ: "JWT"}
Payload: {userId, role, exp, iat}
Signature: HMAC(secret, header.payload)
```

### Password Security
- **bcrypt:** Industry standard password hashing with auto salt + iteration
- **Cost Factor: 10:** Balance between security and login speed
- **No Plain Text:** Passwords never stored; only hashes stored in database

### Alternatives Considered

| Method | Pros | Cons | Why Not |
|-----------|------|------|---------|
| **Session-based Auth** | Traditional, simple | Requires server storage, doesn't scale horizontally | Stateless better for cloud |
| **OAuth 2.0** | Enterprise standard | Complexity, multiple flows, overkill for MVP | JWT sufficient; can add later |
| **Multi-factor Auth (MFA)** | More secure | Additional complexity, SMS/email costs | MVP doesn't require; can add later |
| **API Keys** | Simple for services | Less secure, no user context | JWT better for user auth |

### Trade-offs
- **Security vs Usability:** Token expiry requires refresh tokens (accepted: 7-day expiry reasonable for MVP)
- **Stateless vs Control:** Cannot revoke tokens before expiry (accepted: short token lifespan mitigates)
- **Simplicity vs Enterprise Features:** No built-in MFA, SAML, or OAuth (accepted: MVP level features sufficient)

---

## 5. Project Architecture: Modular Organization

### Decision
Organized backend as **modular system** with folder-per-feature structure.

### Backend Structure
```
src/
├── modules/         # Feature modules (isolated units)
│   ├── auth/        # Authentication: JWT, login, token
│   ├── users/       # User management: CRUD, roles
│   ├── records/     # Financial records: CRUD, filtering
│   ├── dashboard/   # Summary APIs: totals, trends
├── shared/          # Cross-cutting concerns
│   ├── access-control/  # RBAC, permissions
│   ├── middleware/      # Auth, error handling
│   ├── validation/      # Input validation
│   ├── errors/          # Typed error handling
│   └── utils/           # Helper functions
├── config/          # Database, auth config
└── routes/          # Route aggregation
```

### Reasoning
- **Scalability:** Each module is independent; easy to add features
- **Maintainability:** Single-responsibility principle; clear ownership
- **Testability:** Isolated modules are easy to unit test
- **Onboarding:** New developers understand structure immediately
- **Reusability:** Shared middleware/validation reused across modules

### Alternatives Considered

| Architecture | Pros | Cons | Why Not |
|--------------|------|------|---------|
| **MVC (Monolithic)** | Simple for small apps | Becomes unmanageable as size grows | Module pattern better |
| **Layered (3-tier)** | Traditional, familiar | Horizontal slicing creates tight coupling | Vertical slicing (modules) better |
| **Microservices** | Independent scaling | Complexity, network overhead, debugging | Overkill for MVP; monolith sufficient |
| **Hexagonal (Ports & Adapters)** | Highly testable, decoupled | Complex, verbose, over-engineered | Module pattern simpler without loss |

### Trade-offs
- **Simplicity vs Modularity:** Module organization adds indirection (accepted: clarity worth it)
- **Premature Optimization:** Module structure before knowing full requirements (accepted: standards-based structure used)

---

## 6. ORM: Prisma

### Decision
Selected **Prisma** as Object-Relational Mapper (vs raw SQL or other ORMs).

### Reasoning
- **Type-Safe:** Auto-generated types from schema; catch errors at compile time
- **Schema as Source of Truth:** One `.prisma` file defines both schemas and relationships
- **Migrations:** Auto-generate migrations from schema changes; version-controlled
- **Developer Experience:** Intuitive API; less boilerplate than raw SQL queries
- **Database Agnostic:** Switch databases by changing provider in `.prisma` (currently PostgreSQL)
- **Seed Management:** Built-in seed script runner for demo data

### Example
```typescript
// Type-safe, autocomplete-friendly
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { records: true }
});
// Auto-generated types catch mistakes at compile time
```

### Alternatives Considered

| ORM | Pros | Cons | Why Not |
|-----|------|------|---------|
| **Raw SQL (pg library)** | Full control, best performance | Verbose, error-prone, no types | Less productive; error-prone |
| **TypeORM** | Full-featured, type-safe | Verbose decorators, complex setup | Prisma simpler, cleaner syntax |
| **Sequelize** | Mature, flexible | Complex, large learning curve | Overkill for MVP |
| **MikroORM** | Type-safe, well-designed | Smaller ecosystem, fewer resources | Prisma ecosystem larger |

### Trade-offs
- **Abstraction vs Control:** Prisma abstracts SQL (accepted: abstraction valuable for MVP)
- **Learning Curve vs Productivity:** Smaller community than TypeORM (accepted: documentation excellent)

---

## 7. Deployment Strategy: Multi-Cloud

### Decision
Distributed deployment across three specialized platforms:
- **Backend:** Render (Node.js hosting)
- **Frontend:** Netlify (static site hosting)
- **Database:** Supabase (PostgreSQL)

### Reasoning
- **Best-of-Breed:** Each platform is optimized for its purpose
- **Cost Efficient:** Free tiers + pay-as-you-go; no wasted resources
- **Failure Isolation:** Database down doesn't take down frontend; outage limited
- **Global CDN:** Both Render and Netlify have global CDN; fast content delivery
- **Simple DevOps:** Automated deployments; push to GitHub = instant deploy

### Architecture Diagram
```
GitHub (Main Branch)
    ↓
    ├→ Netlify (Frontend) → CDN → Browser
    ├→ Render (Backend) → API Requests ← Browser
    └→ Supabase (Database) ← Backend
```

### Alternatives Considered

| Strategy | Pros | Cons | Why Not |
|----------|------|------|---------|
| **Monolithic Deployment** | Simplicity, cost | Not scalable, single point of failure | Multi-cloud better at scale |
| **AWS Everything** | Unified console | Complex IAM, expensive, DevOps heavy | Managed services simpler for MVP |
| **Docker Container Orchestration (K8s)** | Scalable, standard | Steep learning curve, DevOps overhead | Overkill for MVP; cloud platforms sufficient |
| **Self-Hosted** | Full control | Infrastructure cost, maintenance, backups | Managed services free up time |

### Trade-offs
- **Complexity vs Simplicity:** Multiple platforms means multiple dashboards (accepted: each platform is simple)
- **Vendor Lock-in vs Portability:** Supabase/Render specific (accepted: can migrate using standard formats)
- **Cost Predictability vs Scaling:** Usage-based pricing (accepted: clear costs; can optimize later)

---

## 8. Validation & Error Handling Strategy

### Decision
Implemented **typed error hierarchy** with **input validation** on all routes.

### Error Classification
```typescript
// Typed errors with HTTP codes
- ValidationError (400): Input validation failed
- AuthenticationError (401): Login/token invalid
- AuthorizationError (403): Permission denied
- NotFoundError (404): Resource not found
- ConflictError (409): Data conflict
- InternalServerError (500): Unexpected error
```

### Validation Pattern
```typescript
// All inputs validated before business logic
- Schema validation (zod/joi equivalent)
- Type checking (TypeScript)
- Business rule validation (e.g., future dates rejected)
```

### Reasoning
- **Security:** Prevents malicious input; prevents injection attacks
- **User Experience:** Clear error messages; users know what went wrong
- **Developer Experience:** Strong typing; catch errors early
- **Debugging:** Consistent error format; simple error tracking
- **Compliance:** Financial systems require audit trails; structured errors provide this

### Trade-offs
- **Strictness vs Flexibility:** Strict validation means less flexibility (accepted: better for financial data)
- **Boilerplate vs Safety:** Validation adds code (accepted: safety critical in finance)

---

## 9. Role-Based Access Control (RBAC)

### Decision
Implemented **role-based access** with three roles: ADMIN, ANALYST, VIEWER.

### Permission Matrix
```
Resource          ADMIN    ANALYST   VIEWER
─────────────────────────────────────────
User Management   Create   —         —
Auth              Full     Full      Full
Own Records       Full     Full      Read-Only
All Records       Full     Full      —
Dashboard         Full     Full      Read-Only
Settings          Full     —         —
```

### Implementation
- **JWT Payload:** User role included in token; no DB lookup needed
- **Middleware Check:** Every route verifies role before executing business logic
- **Row-Level Filtering:** Records filtered by `createdById`; users only see own records

### Reasoning
- **Security:** Principle of least privilege; users only access what they need
- **Compliance:** Audit separation; analyst cannot delete records
- **Scalability:** Role-based design scales to add new roles easily
- **Database:** Could upgrade to Row-Level Security (RLS) for database-level enforcement

### Trade-Offs
- **Complexity vs Security:** Role system adds complexity (accepted: necessary for finance)
- **Flexibility vs Predefined:** Roles are hardcoded (accepted: can move to database if needed)

---

## 10. Data Persistence & Seeding Strategy

### Decision
Used **Prisma migrations** for schema version control + **SQL seeding** for demo data.

### Schema Management
```
prisma/schema.prisma → Defines all tables, relationships
↓
npm run db:push → Applies to database (auto-creates/updates)
↓
Version controlled → Git tracks all schema changes
```

### Seed Data
```
4 Users (Admin, Analyst, Viewer, Inactive)
62 Financial Records (Jan-Apr 2026):
  - 19 Income records (salary, freelance, investment)
  - 43 Expense records (rent, utilities, groceries, dining, etc.)
```

### Reasoning
- **Version Control:** Schema changes tracked in Git; easy rollback
- **Repeatability:** Seed script produces identical demo data every time
- **Demo Ready:** New deployment instantly has realistic data
- **Migration Safety:** Prisma auto-generates safe migrations (handles data loss warnings)

### Trade-offs
- **Schema Flexibility vs Strictness:** Prisma enforces types (accepted: catches bugs early)
- **Migration Burden:** Schema changes require migration files (accepted: ensures traceability)

---

## 11. Security Measures

### Decision
Implemented **defense-in-depth** security strategy.

### Layers
1. **Network:** HTTPS/TLS only (enforced by hosting platforms)
2. **Input:** Validation on all routes; type checking
3. **Authentication:** JWT tokens; bcrypt hashing
4. **Authorization:** RBAC with role checking
5. **Database:** Parameterized queries (Prisma ORM prevents injection)
6. **Headers:** Helmet.js adds security headers (HSTS, CSP, X-Frame-Options)
7. **Rate Limiting:** Express rate-limit; prevent brute force
8. **Secrets:** `.env` files excluded from Git; secrets in environment variables only

### Trade-offs
- **Convenience vs Security:** Rate limiting may affect load tests (accepted: necessary for production)
- **Complexity vs Coverage:** Additional headers add minimal overhead (accepted: security critical)

---

## 12. Development Experience (DX)

### Decision
Optimized for **fast iteration** and **low friction** development.

### Tools & Practices
- **TypeScript:** Compile-time safety; IDE autocomplete
- **ESM Modules:** Modern JavaScript; clean imports
- **tsx:** Run TypeScript directly in development; no build step needed
- **Prettier:** Auto code formatting; no style arguments
- **Jest:** Simple testing setup; good DX
- **Hot Reload:** Changes instant in dev; quick feedback loop

### Reasoning
- **Productivity:** Developers spend time on features, not tooling
- **Error Catching:** TypeScript catches bugs before runtime
- **Debugging:** Clear error messages; stack traces point to issues
- **Onboarding:** Standard tools; new developers productive quickly

### Trade-offs
- **Performance vs Convenience:** tsx slower than compiled binary (accepted: fine for development)
- **Strictness vs Speed:** TypeScript slower than JavaScript (accepted: catches bugs worth it)

---

## 13. Monitoring & Observability

### Current Approach
- **Error Tracking:** All errors logged with stack trace + user context
- **Request Logging:** Each request logged (method, path, status, duration)
- **Database:** Built-in Supabase monitoring dashboard
- **Hosting:** Render logs; Netlify deployment logs

### Future Enhancements
- Sentry for error tracking
- DataDog/New Relic for APM
- CloudWatch for centralized logging
- Health check endpoints for uptime monitoring

### Reasoning
- **Debugging:** Logs help identify production issues quickly
- **Analytics:** Request patterns reveal usage; inform feature prioritization
- **Compliance:** Financial systems require audit logs

### Trade-offs
- **Cost vs Coverage:** Advanced monitoring costs money (accepted: logs sufficient for MVP)
- **Privacy vs Insight:** User data not logged to protect privacy (accepted: necessary for compliance)

---

## 14. Performance Optimization Strategy

### Current Optimizations
1. **Database Indexing:** Indexes on `createdById`, `date`, `type`, `category`
2. **Query Optimization:** Prisma selects only needed fields
3. **Connection Pooling:** Supabase auto-pools connections
4. **CDN:** Netlify & Render have global CDN for fast content delivery
5. **Compression:** Gzip compression on all HTTP responses

### Potential Future Optimizations
- Caching: Redis for frequently queried data (e.g., dashboard totals)
- Pagination: List APIs paginate results (currently returns all for MVP)
- GraphQL: Could replace REST if queries become complex
- Load Testing: Identify bottlenecks before scaling

### Reasoning
- **Good Enough for MVP:** Current performance sufficient for dashboard scope
- **No Premature Optimization:** Optimize when needed, not before
- **Foundation:** Indexes in place; can add caching/CDN as needed

### Trade-offs
- **Simplicity vs Optimization:** Caching adds complexity (accepted: don't optimize until needed)
- **Cost vs Performance:** Advanced CDN/caching costs money (accepted: simple approach for MVP)

---

## Summary Table: Key Decisions

| Decision | Choice | Why | Key Trade-off |
|----------|--------|-----|----------------|
| Backend Framework | Express + TypeScript | Standard, lightweight, fast | Less structured than alternatives |
| Frontend | Vanilla JS | No build process, simple deploy | Less ergonomic than React |
| Database | Supabase PostgreSQL | Managed, reliable, feature-rich | Vendor lock-in |
| Auth | JWT + bcrypt | Stateless, scalable, standard | Cannot revoke tokens before expiry |
| Architecture | Modular organization | Scalable, maintainable, testable | More folders/indirection than monolithic |
| ORM | Prisma | Type-safe, migrations, DX | Less control than raw SQL |
| Deployment | Multi-cloud (Render/Netlify/Supabase) | Best-of-breed services | Vendor lock-in across three platforms |
| RBAC | 3 roles (ADMIN/ANALYST/VIEWER) | Security, simplicity | Not as flexible as permissions-based |
| Errors | Typed error hierarchy | Clear, consistent, debuggable | More boilerplate |
| Security | Defense-in-depth layers | Comprehensive protection | Some performance overhead |

---

## Conclusion

These decisions were made to **maximize productivity on MVP scope** while **maintaining production quality**. The architecture is designed to scale if needed, but optimizes for simplicity and fast iteration at this stage.

### Key Principles Applied
- ✅ **Use Standard Tools:** Express, PostgreSQL, JWT are industry standards
- ✅ **Strong Typing:** TypeScript catches bugs early
- ✅ **Security First:** Financial data requires careful protection
- ✅ **Simple to Deploy:** Three-platform strategy enables one-click deployment
- ✅ **Easy to Maintain:** Modular organization, clear error handling
- ✅ **Fast Development:** Zero-config local dev; focus on features

### When to Revisit These Decisions
- Scale beyond 10K users → Consider microservices, advanced caching
- Complex queries → Consider GraphQL, database query optimization
- Multi-region → Consider global database replication
- Team growth → Consider more structured frameworks (NestJS)
- Real-time requirements → Consider WebSocket architecture, Redis pub/sub
