# Production Deployment Checklist

## 🔴 CRITICAL - Schema Mismatch Issue & Fix

**Issue:** Error 42704 - `type "public.RecordType" does not exist`  
**Root Cause:** Production database schema doesn't match Prisma  
**Fix:** Run `prisma db push` to apply schema

---

## ✅ Quick Fix (Execute NOW)

```powershell
cd backend

# Set production DATABASE_URL
$env:DATABASE_URL="postgresql://postgres.wdwlijnkisqlnuwmoidh:FfDtBgqIYVh6wm66@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Apply schema (creates enum types)
npx prisma db push --skip-generate

# Regenerate client
npx prisma generate

# Verify it worked
npm run verify:seed
```

**Expected result:**
```
✅ Production seed verification: PASSED (4/4 users verified)
```

---

## 🚀 Production Deployment Checklist

### Phase 1: Schema Setup (One-Time)

- [ ] **Apply Prisma schema** to production database
  ```bash
  npx prisma db push --skip-generate
  ```
  Creates: RecordType, Role, UserStatus enum types
  
- [ ] **Verify schema applied**
  ```bash
  npx prisma generate
  npm run verify:seed
  ```
  Should show: PASSED (4/4 users verified)

### Phase 2: Seed Demo Users (One-Time)

- [ ] **Generate seed SQL**
  ```bash
  npx tsx scripts/generate-seed-sql.ts > ../docs/seed-generated.sql
  ```

- [ ] **Apply seed in Supabase**
  1. Go to Supabase SQL Editor
  2. Copy-paste generated SQL
  3. Click Run

- [ ] **Verify demo users seeded**
  ```bash
  npm run verify:seed:prod
  ```

### Phase 3: Backend Deployment

- [ ] **Update Render Build Command** (Settings → Build Command)
  ```
  npm install --include=dev && npm run build && npx prisma db push --skip-generate
  ```
  
- [ ] **Set Environment Variables** (Settings → Environment)
  ```
  DATABASE_URL = postgresql://...pooler.supabase.com:6543/...
  JWT_SECRET = [secret-key]
  NODE_ENV = production
  CORS_ORIGIN = https://finance-dashboard-pro.netlify.app
  ```

- [ ] **Test Backend Health**
  ```bash
  curl https://finance-dashboard-api-hqjk.onrender.com/health
  ```
  Expected: 200 OK

### Phase 4: Frontend Deployment

- [ ] **Deploy to Netlify** (already done)
  - Frontend auto-detects environment
  - Uses Render backend URL in production

- [ ] **Test API Connection**
  Go to: https://finance-dashboard-pro.netlify.app
  - Should load without errors
  - No 500 errors from backend

### Phase 5: End-to-End Testing

- [ ] **Test Admin Login**
  - Email: `admin@finance-dashboard.local`
  - Password: `AdminPassword123`
  - Expected: Dashboard loads, shows financial data

- [ ] **Test Analyst Login**
  - Email: `analyst@finance-dashboard.local`
  - Password: `AnalystPassword123`
  - Expected: Can view records (different from admin)

- [ ] **Test Viewer Login**
  - Email: `viewer@finance-dashboard.local`
  - Password: `ViewerPassword123`
  - Expected: Read-only access

- [ ] **Test Inactive User (Should Fail)**
  - Email: `inactive@finance-dashboard.local`
  - Password: `InactivePassword123`
  - Expected: 401 Unauthorized (correct behavior)

---

## 🛡️ Safety Checklist Before Going Live

- [ ] ✅ Schema applied (enums exist)
- [ ] ✅ Demo users verified with correct passwords
- [ ] ✅ Backend health check passes
- [ ] ✅ All 4 users can login (except inactive)
- [ ] ✅ Dashboard loads and shows data
- [ ] ✅ No 500 errors in browser console
- [ ] ✅ No errors in Render logs

---

## 📚 Reference Documentation

- **Schema Mismatch Details:** [SCHEMA_MISMATCH_FIX.md](./SCHEMA_MISMATCH_FIX.md)
- **Full Setup Guide:** [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **Seed Verification:** [SEED_VERIFICATION.md](./SEED_VERIFICATION.md)
- **Quick Reference:** [SEED_VERIFICATION_QUICK_START.md](./SEED_VERIFICATION_QUICK_START.md)

---

## 🚨 Common Issues & Fixes

### Issue: Still getting "type RecordType does not exist"

**Fix:**
```bash
# Verify schema was applied
$env:DATABASE_URL="..."
npx prisma db push --skip-generate

# Check if enum exists (SQL)
SELECT * FROM pg_type WHERE typname = 'RecordType';

# If not found, try again with force
npx prisma db push
```

### Issue: Seed verification still fails

**Fix:**
1. Check if User table has data
   ```sql
   SELECT COUNT(*) FROM "User";
   ```
2. If empty, re-run seed SQL from Supabase SQL Editor
3. Run verification again

### Issue: Backend returns 500 on dashboard load

**Cause:** FinancialRecord table or enums missing  
**Fix:** Re-run `npx prisma db push --skip-generate`

---

## ✨ Going Forward

### For Next Deploys

Every production deployment should include:

```bash
# Build Command
npm install --include=dev && npm run build && npx prisma db push --skip-generate
```

This ensures:
- Dependencies installed
- Code compiled
- **Schema always in sync**
- App only starts if schema is valid

### For Local Development

Always use:
```bash
npm run db:seed
```

This keeps local schema in sync with code.

---

## 📞 Emergency Rollback

If something breaks in production:

1. **Don't** delete tables or data
2. **Do** check Render logs for exact error
3. **Do** run schema verification
4. **Do** run `npx prisma db push --skip-generate` again
5. **Do** restart Render service

Schema changes are reversible - focus on getting schema/data in sync.

---

## ✅ Success Criteria

- [ ] Login page loads without 500 errors
- [ ] Demo admin can login
- [ ] Dashboard shows financial data
- [ ] No "type does not exist" errors in backend logs
- [ ] Verification script returns PASSED
- [ ] All role-based access works correctly

Once all boxes checked → **Production Ready!** 🚀

