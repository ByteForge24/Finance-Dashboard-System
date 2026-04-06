# Production Database Setup & Login Troubleshooting

## Problem: Production Login Returns 401 Unauthorized

**Root Cause**: Database seed credentials mismatch between frontend and production.

The frontend demo credentials use `seed.ts` hashed passwords, but production Supabase might have been seeded with different hashes.

---

## Production Setup Steps (One-Time)

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

### Step 3: Verify Seeding Succeeded

1. Go to **Supabase Dashboard** → **Data Editor**
2. Click **Users** table
3. Verify you see 4 demo users:
   - `admin@finance-dashboard.local` (ACTIVE)
   - `analyst@finance-dashboard.local` (ACTIVE)
   - `viewer@finance-dashboard.local` (ACTIVE)
   - `inactive@finance-dashboard.local` (INACTIVE)

### Step 4: Test Login

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
3. Verify it ends with `:6543/postgres?sslmode=require` (Transaction Pooler, not direct connection)
4. If connection string is wrong, update in Render Settings → Environment

---

## Database Connection Details

**For Render (Production)**:
- **Host**: `aws-1-ap-northeast-2.pooler.supabase.com`
- **Port**: `6543` (Transaction Pooler)
- **Database**: `postgres`
- **SSL**: Required (`sslmode=require`)

**For Local Development**:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `finance_dashboard_dev`
- **SSL**: Not required

---

## Automation Improvement (Future)

To make this automatic on Render deployment:

1. Add `npm run db:seed` to Render **Build Command**:
   ```
   npm install --include=dev && npm run build && npm run db:seed
   ```

**This would**:
   - Compile TypeScript
   - Seed database automatically
   - No manual SQL needed

**Drawback**: Requires stopping server during seed (difficult during rolling deploys)

**Better approach**: Create an admin API endpoint:
```
POST /api/v1/admin/seed/users
Authorization: Bearer <admin-token>
Body: { "resetExisting": false }
```

For now, manual SQL seeding is safest and most explicit.

---

## Testing Different Scenarios

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
