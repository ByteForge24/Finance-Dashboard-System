# Seed Data Verification Workflow

## Overview

The **seed verification** workflow prevents silent deployment failures by automatically checking that production demo credentials are correctly seeded before the API goes live.

**Problem it solves:**
- ❌ Demo login failing with 401 after deployment (auth logic appears broken, but seed data is actually wrong)
- ❌ Silent credential mismatches between frontend and database
- ❌ Undetected password hash corruption during migration
- ❌ Differences between local dev and production authentication

**Solution:**
- ✅ Automated password hash validation using bcrypt
- ✅ Clear pass/fail report visible in logs
- ✅ Fails deployment if seed data is corrupted
- ✅ No plaintext passwords exposed

---

## Quick Start

### For Manual Testing

```bash
# Verify seed data in current database
cd backend
npm run verify:seed

# Output example (success):
# ================================================================================
# 🔐 Production Seed Verification
# ================================================================================
# 
# Email                                  | Exists | Role  | Status | Password | Status
# ----------------------------------------|--------|-------|--------|----------|--------
# admin@finance-dashboard.local          | ✅     | ✅    | ✅     | ✅       | OK
# analyst@finance-dashboard.local        | ✅     | ✅    | ✅     | ✅       | OK
# viewer@finance-dashboard.local         | ✅     | ✅    | ✅     | ✅       | OK
# inactive@finance-dashboard.local       | ✅     | ✅    | ✅     | ✅       | OK
#
# ================================================================================
# ✅ Production seed verification: PASSED (4/4 users verified)
# ================================================================================
```

### For Production Verification

```bash
# Requires: DATABASE_URL environment variable pointing to production
npm run verify:seed:prod

# Script will warn:
# ⚠️  WARNING: DATABASE_URL appears to be PRODUCTION Supabase
#    Ensure you intentionally want to verify production data.
```

---

## What Gets Verified

| Check | Expected | How it's Verified | Fails if |
|-------|----------|-------------------|----------|
| **User Exists** | 4 demo users with specific emails | Query database for email | User not found |
| **Role** | ADMIN, ANALYST, VIEWER, VIEWER | Compare role field | Role mismatch (`ADMIN` vs `VIEWER`) |
| **Status** | ACTIVE, ACTIVE, ACTIVE, INACTIVE | Compare status field | Status mismatch (`ACTIVE` vs `INACTIVE`) |
| **Password** | Bcrypt hash matches known password | `bcrypt.compare(password, hash)` | Hash invalid for password |

---

## Expected Demo Users

The script verifies these exact users:

```
Email: admin@finance-dashboard.local
  Role: ADMIN
  Status: ACTIVE
  Password: AdminPassword123
  
Email: analyst@finance-dashboard.local
  Role: ANALYST
  Status: ACTIVE
  Password: AnalystPassword123
  
Email: viewer@finance-dashboard.local
  Role: VIEWER
  Status: ACTIVE
  Password: ViewerPassword123
  
Email: inactive@finance-dashboard.local
  Role: VIEWER
  Status: INACTIVE (intentionally inactive for testing)
  Password: InactivePassword123
```

---

## Safety Guarantees

### ✅ Passwords Never Exposed

- Plaintext passwords **never** printed to logs
- Only bcrypt hashes are in database
- Only password comparison results shown (✅ valid / ❌ invalid)
- Demo credentials kept as documentation separate from code

### ✅ Read-Only Verification

- Script **only queries** the database
- **Never modifies** any data
- Safe to run multiple times
- Safe for production (no changes made)

### ✅ Production Awareness

- Script detects when DATABASE_URL is production Supabase
- Prints clear **production warning** before running
- Developers must intentionally set DATABASE_URL to prod
- Script name includes `:prod` variant to make intent explicit

### ✅ Fail-Safe Exit Codes

- **Exit code 0** = All checks passed (safe to deploy)
- **Exit code 1** = Any check failed (stop deployment)
- Works with CI/CD systems (GitHub Actions, etc.)
- Works with Render/Netlify deployment hooks

---

## Usage by Role

### 🧑‍💻 Developer (Local Testing)

**Scenario:** You just ran `npm run db:seed` locally and want to verify it worked.

```bash
cd backend
npm run verify:seed

# Expected: PASSED
```

### 🚀 DevOps (Pre-Deployment)

**Scenario:** Just seeded production database and want to confirm before rollout.

```bash
# Option 1: Have Render shell access
ssh <render-instance>
cd /opt/render/project/backend
npm run verify:seed:prod

# Option 2: Run locally against prod DB
DATABASE_URL="postgresql://user:pass@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require" npm run verify:seed
```

### 🔧 CI/CD Pipeline

**Scenario:** Automated deployment script should fail if seed data is broken.

```bash
#!/bin/bash
set -e  # Exit on any error

# ... deployment steps ...

# After seeding database, verify before starting API
npm run verify:seed:prod || {
  echo "❌ Seed verification failed - deployment aborted"
  exit 1
}

# If we get here, seed is valid
npm start
```

### 🧪 QA/Tester

**Scenario:** Verifying production credentials work before testing login.

```bash
# 1. Check backend is running
curl https://finance-dashboard-api-hqjk.onrender.com/health

# 2. Verify credentials exist
npm run verify:seed:prod

# 3. If PASSED, test login in frontend
# Go to https://finance-dashboard-pro.netlify.app
# Try demo admin login
```

---

## What to Do If Verification Fails

### Scenario 1: User Not Found

**Error:**
```
❌ admin@finance-dashboard.local
   └─ Error: User not found in database
```

**Steps:**
1. Go to Supabase SQL Editor
2. Check if Users table exists: `SELECT * FROM "User" LIMIT 1;`
3. If table empty, run seed SQL: `backend/scripts/generate-seed-sql.ts`
4. Re-run verification

### Scenario 2: Role Mismatch

**Error:**
```
❌ analyst@finance-dashboard.local
   └─ Error: Role mismatch: expected ANALYST, got VIEWER
```

**Steps:**
1. SQL seed might have wrong role column
2. Delete existing users or full table
3. Re-run seed SQL
4. Re-run verification

### Scenario 3: Password Hash Invalid

**Error:**
```
❌ admin@finance-dashboard.local
   └─ Error: Password hash does not match expected password
```

**Steps (CRITICAL):**
1. This means the bcrypt hash in database doesn't match the password
2. Possible causes:
   - Database was seeded with old/wrong SQL
   - Password was manually changed
   - Hash was corrupted during migration
3. **Only fix:** Re-generate and re-apply seed SQL
   ```bash
   # Generate fresh SQL
   npx tsx backend/scripts/generate-seed-sql.ts > backend/temp-seed.sql
   
   # Apply in Supabase SQL Editor
   # (paste contents of temp-seed.sql)
   ```
4. Re-run verification

---

## Implementation Details

### Script Location
```
backend/scripts/verify-production-seed.ts
```

### npm Scripts Added
```json
{
  "scripts": {
    "verify:seed": "tsx scripts/verify-production-seed.ts",
    "verify:seed:prod": "NODE_ENV=production tsx scripts/verify-production-seed.ts"
  }
}
```

### Dependencies Used
- **Prisma Client** - database queries
- **bcryptjs** - password hash validation
- **Prisma Enums** - UserStatus, Role validation

### Exit Codes
```
0 = Verification PASSED - all demo users valid
1 = Verification FAILED - at least one check failed
1 = Script error - couldn't connect to database
```

---

## Best Practices

### ✅ DO

- Run verification after every seed operation
- Include verification in automated deployment pipelines
- Use `npm run verify:seed:prod` before going live
- Keep demo credentials documented in one place (frontend code)
- Regenerate seed SQL if passwords ever change

### ❌ DON'T

- Ignore verification failures
- Modify verified seed data manually in Supabase (re-seed instead)
- Change demo credentials without regenerating seed SQL
- Remove this check to speed up deployment
- Deploy with failed verification

---

## Troubleshooting

### "Cannot find module 'typescript'" Error

```bash
npm install  # Ensure dependencies installed including dev deps
npm run verify:seed
```

### "Prisma Client not generated" Error

```bash
# Regenerate Prisma types
npx prisma generate
npm run verify:seed
```

### "Cannot access DATABASE_URL" Error

```bash
# Ensure .env is loaded
cat .env  # Check it exists

# Or provide explicit DATABASE_URL
DATABASE_URL="postgresql://..." npm run verify:seed
```

### Script Times Out

```bash
# Might be database connectivity issue
# For Render: check Prisma is using pooler endpoint
echo $DATABASE_URL | grep "pooler.supabase.com:6543"

# Should output:
# postgresql://...@aws-1-ap-northeast-2.pooler.supabase.com:6543/...
```

---

## Related Documentation

- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Setup guide with verification instructions
- [backend/scripts/verify-production-seed.ts](../backend/scripts/verify-production-seed.ts) - Full script implementation
- [backend/scripts/generate-seed-sql.ts](../backend/scripts/generate-seed-sql.ts) - Seed SQL generator
- [backend/prisma/seed.ts](../backend/prisma/seed.ts) - Original seed source (must match verify expectations)

---

## FAQ

**Q: Can I run this against production accidentally?**
- A: Script will warn you with `⚠️  WARNING: DATABASE_URL appears to be PRODUCTION`. Still safe since it only reads data.

**Q: Does verification modify the database?**
- A: No, it's read-only. Safe to run anytime.

**Q: What if I add/remove demo users?**
- A: Update expected users list in script and regenerate seed SQL.

**Q: Can I integrate this with GitHub Actions?**
- A: Yes! Set DATABASE_URL secret and add `npm run verify:seed:prod` to workflow.

**Q: What if bcrypt hashing changes?**
- A: Seed SQL is pre-computed, so hashing algorithm is fixed. Just needs to stay consistent with seed.ts.

---

## Future Improvements

- [ ] Parametrize expected users (config file instead of hardcoded)
- [ ] Add JSON output mode for CI/CD parsing
- [ ] Add database reset/seed command if verification fails (`--auto-fix` flag)
- [ ] Add performance metrics (query times, etc.)
- [ ] Integrate with health check endpoint

