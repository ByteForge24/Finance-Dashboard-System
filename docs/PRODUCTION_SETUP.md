# Production Database Setup & Login Troubleshooting

## Problem: Production Login Returns 401 Unauthorized

**Root Cause**: Database seed credentials mismatch between frontend and production.

The frontend demo credentials use `seed.ts` hashed passwords, but production Supabase might have been seeded with different hashes.

---

## Production Setup Steps (One-Time)

### Step 0: Apply Prisma Schema (CRITICAL - Do First)

**⚠️ IMPORTANT:** Schema must be applied BEFORE seeding data.

This creates PostgreSQL enum types and ensures database structure matches Prisma:

```bash
cd backend

# Set production DATABASE_URL
$env:DATABASE_URL="postgresql://postgres.wdwlijnkisqlnuwmoidh:FfDtBgqIYVh6wm66@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"
$env:DIRECT_URL="postgresql://postgres.wdwlijnkisqlnuwmoidh:FfDtBgqIYVh6wm66@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Apply schema (creates enums, tables, indexes)
npx prisma db push --skip-generate

# Regenerate Prisma Client
npx prisma generate
```

**What this does:**
- ✅ Creates PostgreSQL enum types (`RecordType`, `Role`, `UserStatus`)
- ✅ Creates/updates `User` and `FinancialRecord` tables
- ✅ Creates database indexes
- ✅ Preserves any existing data (schema-only change)

**Why:** Without this, queries fail with "type does not exist" errors (error 42704).

**See:** [SCHEMA_MISMATCH_FIX.md](./SCHEMA_MISMATCH_FIX.md) for detailed explanation.

---

### Step 1: Generate Correct Seed SQL

This generates SQL with bcrypt hashes that EXACTLY MATCH the frontend demo credentials:

```bash
cd backend
npx tsx scripts/generate-seed-sql.ts > seed-generated.sql
```

This outputs SQL like:
```sql
INSERT INTO "User" (...) VALUES
  ('admin-id-001', 'Admin User', 'admin@finance-dashboard.local', '$2a$10$...hash...', 'ADMIN', 'ACTIVE', NOW(), NOW()),
  ...
```

### Step 2: Apply Seed to Production Database

1. Go to **Supabase Dashboard** → Project → **SQL Editor**
2. Click **New Query**
3. Open the generated `seed-generated.sql` file
4. Copy-paste the entire SQL into the editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Seeding Succeeded (Automated Check)

**Recommended:** Use the automated verification script to confirm seed data is correct:

```bash
# From backend directory
npm run verify:seed
```

This script will:
- ✅ Check all 4 demo users exist
- ✅ Verify roles are correct (ADMIN, ANALYST, VIEWER, VIEWER)
- ✅ Verify statuses are correct (3 ACTIVE, 1 INACTIVE)
- ✅ Validate password hashes using bcrypt comparison
- 🚨 Fail loudly if anything is mismatched

**Example successful output:**
```
================================================================================
🔐 Production Seed Verification
================================================================================

Verification Results:

Email                                  | Exists | Role  | Status | Password | Status
----------------------------------------|--------|-------|--------|----------|--------
admin@finance-dashboard.local          | ✅     | ✅    | ✅     | ✅       | OK
analyst@finance-dashboard.local        | ✅     | ✅    | ✅     | ✅       | OK
viewer@finance-dashboard.local         | ✅     | ✅    | ✅     | ✅       | OK
inactive@finance-dashboard.local       | ✅     | ✅    | ✅     | ✅       | OK

================================================================================
✅ Production seed verification: PASSED (4/4 users verified)
================================================================================
```

**If verification fails:**
- Review the error message for which user/field is wrong
- Re-run the seed SQL from Supabase (may need to delete old data first)
- Run verification again to confirm

---

### Step 4: Manual Verification (Optional)

If you prefer manual verification or don't have Node.js access:

1. Go to **Supabase Dashboard** → **Data Editor**
2. Click **Users** table
3. Verify you see 4 demo users:
   - `admin@finance-dashboard.local` (ACTIVE, ADMIN)
   - `analyst@finance-dashboard.local` (ACTIVE, ANALYST)
   - `viewer@finance-dashboard.local` (ACTIVE, VIEWER)
   - `inactive@finance-dashboard.local` (INACTIVE, VIEWER)

---

### Step 5: Test Login

**Frontend URL**: `https://finance-dashboard-pro.netlify.app`

**Demo Credentials** (now working):
- **Admin**: `admin@finance-dashboard.local` / `AdminPassword123`
- **Analyst**: `analyst@finance-dashboard.local` / `AnalystPassword123`
- **Viewer**: `viewer@finance-dashboard.local` / `ViewerPassword123`

---

## Important Notes

### Why Two Seed Methods?

- **`npm run db:seed` (TypeScript)**
  - For local development
  - Uses Prisma ORM
  - Requires Node.js + DATABASE_URL connection
  
- **`scripts/generate-seed-sql.ts` (SQL)**
  - For production (Supabase)
  - Generates SQL that can be copy-pasted
  - Passwords EXACTLY match `npm run db:seed`
  - No server restart needed

### Password Security

All demo passwords are:
- ✅ Hashed with bcrypt (cost factor 10)
- ✅ Different for each role
- ✅ Clearly marked as demo (change in production if public)
- ✅ Never stored in plain text

### If Login Still Fails

Check the debug logs on Render:

1. Go to **Render Dashboard** → `finance-dashboard-api` → **Logs**
2. Look for: `DATABASE_URL_RUNTIME: postgresql://...`
3. Verify `DATABASE_URL` ends with `:6543/postgres?sslmode=require` and `DIRECT_URL` ends with `:5432/postgres?sslmode=require`
4. If connection string is wrong, update in Render Settings → Environment

---

## Database Connection Details

**For Render (Production)**:
- **Host**: `aws-1-ap-northeast-2.pooler.supabase.com`
- **Port**: `6543` (Transaction Pooler for runtime `DATABASE_URL`)
- **Database**: `postgres`
- **SSL**: Required (`sslmode=require`)

**For Local Development**:
- **Host**: `localhost`
- **Host**: `aws-1-ap-northeast-2.pooler.supabase.com`
- **Port**: `5432` (Session Pooler for `DIRECT_URL`)
- **Database**: `finance_dashboard_dev`
- **SSL**: Not required

---

## Verifying Seed Data (CI/CD & Manual)

To prevent seed data from silently mismatching during deployment, use the verification script:

### Running Verification

**For Development (uses local `.env`)**:
```bash
npm run verify:seed
```

**For Production (uses production DATABASE_URL)**:
```bash
# From backend directory, with production DATABASE_URL set
npm run verify:seed:prod
```

**Or with explicit database override**:
```bash
DATABASE_URL="postgresql://user:pass@host:port/db" npm run verify:seed
```

### What It Checks

The script verifies:
1. ✅ All 4 demo users exist (`admin`, `analyst`, `viewer`, `inactive`)
2. ✅ Role assignments are correct
3. ✅ Account status is correct (3 ACTIVE, 1 INACTIVE)
4. ✅ Password hashes validate against known passwords using bcrypt

### Safety Mechanisms

- **Auto-warns** if DATABASE_URL points to production Supabase
- **Never exposes** plaintext passwords in output
- **Fails loudly** with exit code 1 if any check fails
- **Provides actionable** next steps if verification fails
- **Safe for CI/CD** integration (exit codes work with build systems)

### CI/CD Integration Example

In your deployment process, add:

```bash
# After database migration/seed
npm run verify:seed:prod
```

If this fails, deployment stops (exit code 1) before serving broken API.

### What to Do If Verification Fails

1. **Check the error message** - tells you exactly which field is wrong
2. **If seed data is missing**: Re-run the SQL from Supabase SQL Editor
3. **If hashes are wrong**: Delete existing users and re-run SQL
4. **Re-run verification** to confirm fix

---

## Automated Deployment (Render Integration)

To prevent schema mismatches in future deployments, add schema-push to the build process:

### Render Build Command (Recommended)

Update Render **Build Command** to:
```bash
npm install --include=dev && npx prisma db push --skip-generate && npm run build
```

**What this does:**
- Installs dependencies (including TypeScript, Prisma)
- **Applies Prisma schema to production database FIRST** (creates enums, tables, UUID defaults)
- **Regenerates Prisma client with correct types from database**
- Compiles TypeScript to JavaScript (succeeds because types are now available)
- Server starts only if build is successful
- If any step fails, deployment stops (fail-fast)

**Why this order matters:**
- Prisma types must be generated from the database schema
- Without running `db push` first, TypeScript build fails with missing enum type errors
- This approach ensures the database schema and application code are always in sync

**Critical:** This prevents the "type does not exist" error from happening again.

### Render Environment Variables

Ensure set in Render dashboard:
```
DATABASE_URL = postgresql://postgres.wdwlijnkisqlnuwmoidh:FfDtBgqIYVh6wm66@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
DIRECT_URL = postgresql://postgres.wdwlijnkisqlnuwmoidh:FfDtBgqIYVh6wm66@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
JWT_SECRET = [your jwt secret]
NODE_ENV = production
CORS_ORIGIN = https://finance-dashboard-pro.netlify.app
```

### If You Want to Seed Data Automatically

To add financial records during deployment (optional):

```bash
npm install --include=dev && npm run build && npx prisma db push --skip-generate && npx tsx prisma/seed.ts
```

**Note:** This will re-create all financial records, losing any manual changes.

---

## Recommended Deployment Sequence

**For first-time production setup:**
1. Run Step 0 (schema-push) manually
2. Run verification to confirm schema
3. Manually seed via SQL (Steps 1-2)
4. Test login (Step 5)
5. Update Render build command for future deployments

**For subsequent deployments:**
- Update Render **Build Command** to include `npx prisma db push --skip-generate`
- This ensures schema stays in sync automatically
- Only need manual steps if adding new data

---

## Testing Production Setup

### Test Active User Login (Should Work)
```
Email: admin@finance-dashboard.local
Password: AdminPassword123
→ Expected: Success, see Dashboard
```

### Test Inactive User Login (Should Fail)
```
Email: inactive@finance-dashboard.local
Password: InactivePassword123
→ Expected: 401 "User account is inactive"
```

### Test Wrong Password (Should Fail)
```
Email: admin@finance-dashboard.local
Password: WrongPassword
→ Expected: 401 "Invalid email or password"
```

### Test Nonexistent User (Should Fail)
```
Email: nonexistent@example.com
Password: anything
→ Expected: 401 "Invalid email or password"
```
