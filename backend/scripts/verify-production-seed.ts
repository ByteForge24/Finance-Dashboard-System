/**
 * Verify Production Seed Data
 * 
 * Checks that demo users exist in the database with correct credentials.
 * This prevents silent deployment failures where login fails due to seed data mismatch.
 * 
 * Usage:
 *   npm run verify:seed              # Uses current DATABASE_URL
 *   DATABASE_URL=... npm run verify:seed  # Override for ad-hoc testing
 * 
 * Safety: Will warn if DATABASE_URL appears to be production.
 * Exit codes: 0 = all checks passed, 1 = any check failed
 */

import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { UserStatus, Role } from '@prisma/client';

// Expected demo credentials - must match seed.ts exactly
const EXPECTED_USERS = [
  {
    email: 'admin@finance-dashboard.local',
    password: 'AdminPassword123',
    expectedRole: Role.ADMIN,
    expectedStatus: UserStatus.ACTIVE,
  },
  {
    email: 'analyst@finance-dashboard.local',
    password: 'AnalystPassword123',
    expectedRole: Role.ANALYST,
    expectedStatus: UserStatus.ACTIVE,
  },
  {
    email: 'viewer@finance-dashboard.local',
    password: 'ViewerPassword123',
    expectedRole: Role.VIEWER,
    expectedStatus: UserStatus.ACTIVE,
  },
  {
    email: 'inactive@finance-dashboard.local',
    password: 'InactivePassword123',
    expectedRole: Role.VIEWER,
    expectedStatus: UserStatus.INACTIVE,
  },
];

interface VerificationResult {
  email: string;
  exists: boolean;
  roleMatch: boolean;
  statusMatch: boolean;
  passwordValid: boolean;
  errorMessage?: string;
}

async function verifySeed(): Promise<boolean> {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 Production Seed Verification');
  console.log('='.repeat(80) + '\n');

  // Safety check: warn if using production database
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('supabase.com') && !dbUrl.includes('localhost')) {
    console.log('⚠️  WARNING: DATABASE_URL appears to be PRODUCTION Supabase');
    console.log('   Ensure you intentionally want to verify production data.\n');
  }

  const results: VerificationResult[] = [];
  let allPassed = true;

  for (const expectedUser of EXPECTED_USERS) {
    const result: VerificationResult = {
      email: expectedUser.email,
      exists: false,
      roleMatch: false,
      statusMatch: false,
      passwordValid: false,
    };

    try {
      // Query for user
      const user = await prisma.user.findUnique({
        where: { email: expectedUser.email },
      });

      if (!user) {
        result.errorMessage = 'User not found in database';
        results.push(result);
        allPassed = false;
        continue;
      }

      result.exists = true;

      // Check role
      if (user.role === expectedUser.expectedRole) {
        result.roleMatch = true;
      } else {
        result.roleMatch = false;
        result.errorMessage = `Role mismatch: expected ${expectedUser.expectedRole}, got ${user.role}`;
        allPassed = false;
      }

      // Check status
      if (user.status === expectedUser.expectedStatus) {
        result.statusMatch = true;
      } else {
        result.statusMatch = false;
        result.errorMessage = `Status mismatch: expected ${expectedUser.expectedStatus}, got ${user.status}`;
        allPassed = false;
      }

      // Verify password hash
      const passwordValid = await bcrypt.compare(
        expectedUser.password,
        user.passwordHash
      );

      if (passwordValid) {
        result.passwordValid = true;
      } else {
        result.passwordValid = false;
        result.errorMessage = 'Password hash does not match expected password';
        allPassed = false;
      }
    } catch (error) {
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      allPassed = false;
    }

    results.push(result);
  }

  // Print results table
  console.log('Verification Results:\n');
  console.log(
    'Email                                  | Exists | Role  | Status | Password | Status'
  );
  console.log(
    '----------------------------------------|--------|-------|--------|----------|--------'
  );

  for (const result of results) {
    const exists = result.exists ? '✅' : '❌';
    const role = result.roleMatch ? '✅' : '❌';
    const status = result.statusMatch ? '✅' : '❌';
    const password = result.passwordValid ? '✅' : '❌';
    const statusStr = result.exists && result.roleMatch && result.statusMatch && result.passwordValid ? 'OK' : 'FAIL';

    const email = result.email.padEnd(38);
    console.log(
      `${email} | ${exists}     | ${role}    | ${status}     | ${password}       | ${statusStr}`
    );

    if (result.errorMessage) {
      console.log(`   └─ Error: ${result.errorMessage}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  const passed = results.filter((r) => r.exists && r.roleMatch && r.statusMatch && r.passwordValid).length;
  const total = results.length;

  if (allPassed) {
    console.log(`✅ Production seed verification: PASSED (${passed}/${total} users verified)`);
    console.log('='.repeat(80) + '\n');
    return true;
  } else {
    console.log(`❌ Production seed verification: FAILED (${passed}/${total} users passed)`);
    console.log('\n📋 Next steps:');
    console.log('   1. Review the errors above');
    console.log('   2. If seed data is missing, run: go to Supabase SQL Editor');
    console.log('   3. Copy-paste the SQL from: docs/seed-users-production.sql');
    console.log('   4. Run verification again');
    console.log('='.repeat(80) + '\n');
    return false;
  }
}

// Main execution
(async () => {
  try {
    const passed = await verifySeed();
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification script error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
