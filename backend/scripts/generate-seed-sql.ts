/**
 * Generate SQL seed file from seed.ts passwords
 * This ensures production DATABASE_URL passwords match seed.ts exactly
 * 
 * Usage: npx tsx scripts/generate-seed-sql.ts > seed-with-exact-hashes.sql
 */

import bcrypt from 'bcryptjs';

const DEMO_USERS = [
  {
    id: 'admin-id-001',
    name: 'Admin User',
    email: 'admin@finance-dashboard.local',
    password: 'AdminPassword123',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    id: 'analyst-id-002',
    name: 'Analyst User',
    email: 'analyst@finance-dashboard.local',
    password: 'AnalystPassword123',
    role: 'ANALYST',
    status: 'ACTIVE',
  },
  {
    id: 'viewer-id-003',
    name: 'Viewer User',
    email: 'viewer@finance-dashboard.local',
    password: 'ViewerPassword123',
    role: 'VIEWER',
    status: 'ACTIVE',
  },
  {
    id: 'inactive-id-004',
    name: 'Inactive User',
    email: 'inactive@finance-dashboard.local',
    password: 'InactivePassword123',
    role: 'VIEWER',
    status: 'INACTIVE',
  },
];

console.log('-- Generated seed SQL with bcrypt hashes from seed.ts passwords');
console.log('-- Run this in Supabase SQL Editor → copy entire output\n');

console.log('-- Delete existing test users (keep if you want to preserve data)');
console.log("-- DELETE FROM \"User\" WHERE email LIKE '%finance-dashboard.local%';\n");

console.log('-- Insert demo users with correct password hashes');
console.log('INSERT INTO "User" (id, name, email, "passwordHash", role, status, "createdAt", "updatedAt")');
console.log('VALUES');

const rows = DEMO_USERS.map((user, idx) => {
  const hash = bcrypt.hashSync(user.password, 10);
  const comma = idx < DEMO_USERS.length - 1 ? ',' : ';';
  return `  ('${user.id}', '${user.name}', '${user.email}', '${hash}', '${user.role}', '${user.status}', NOW(), NOW())${comma}`;
});

console.log(rows.join('\n'));

console.log('\n-- Verification: These credentials should work after seed');
DEMO_USERS.forEach((user) => {
  if (user.status === 'ACTIVE') {
    console.log(`-- ${user.email} / ${user.password}`);
  }
});
