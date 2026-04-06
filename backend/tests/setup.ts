import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Safety Guard: Refuse to run if DATABASE_URL doesn't point to a test database.
// This prevents tests from accidentally wiping dev/production data.
// ---------------------------------------------------------------------------
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('_test')) {
  throw new Error(
    `🛑 SAFETY: DATABASE_URL does not contain '_test'.\n` +
    `   Current: ${dbUrl}\n` +
    `   Tests MUST run against a dedicated test database (e.g., finance_dashboard_test).\n` +
    `   Create .env.test with the correct DATABASE_URL.`
  );
}

const adminPasswordHash = bcrypt.hashSync('AdminPassword123', 10);
const analystPasswordHash = bcrypt.hashSync('AnalystPassword123', 10);
const viewerPasswordHash = bcrypt.hashSync('ViewerPassword123', 10);
const inactivePasswordHash = bcrypt.hashSync('InactivePassword123', 10);

async function initializeTestDatabase() {
  try {
    await prisma.user.count();
  } catch (error) {
    throw new Error(
      `🛑 Test database is not available. Tests cannot run.\n` +
      `   Ensure PostgreSQL is running and the test database exists.\n` +
      `   Run: CREATE DATABASE finance_dashboard_test;\n` +
      `   Then: npx prisma db push (with .env.test loaded)\n` +
      `   Error: ${error instanceof Error ? error.message : error}`
    );
  }
}

async function seedTestDatabase() {
  try {
    await prisma.financialRecord.deleteMany({});
  } catch {
    // Table might not exist yet
  }

  // Use upsert to handle concurrent test suites calling beforeAll simultaneously
  await prisma.user.upsert({
    where: { email: 'admin@finance-dashboard.local' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      name: 'Admin User',
      email: 'admin@finance-dashboard.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'analyst@finance-dashboard.local' },
    update: { passwordHash: analystPasswordHash, role: 'ANALYST', status: 'ACTIVE' },
    create: {
      name: 'Analyst User',
      email: 'analyst@finance-dashboard.local',
      passwordHash: analystPasswordHash,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@finance-dashboard.local' },
    update: { passwordHash: viewerPasswordHash, role: 'VIEWER', status: 'ACTIVE' },
    create: {
      name: 'Viewer User',
      email: 'viewer@finance-dashboard.local',
      passwordHash: viewerPasswordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'inactive@finance-dashboard.local' },
    update: { passwordHash: inactivePasswordHash, role: 'VIEWER', status: 'INACTIVE' },
    create: {
      name: 'Inactive User',
      email: 'inactive@finance-dashboard.local',
      passwordHash: inactivePasswordHash,
      role: 'VIEWER',
      status: 'INACTIVE',
    },
  });

  // Seed financial records for dashboard tests
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@finance-dashboard.local' },
  });

  if (admin) {
    // Income records
    await prisma.financialRecord.create({
      data: { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-03-01'), notes: 'Monthly salary', createdById: admin.id },
    });
    await prisma.financialRecord.create({
      data: { amount: 1200, type: 'INCOME', category: 'Freelance', date: new Date('2026-03-15'), notes: 'Freelance project', createdById: admin.id },
    });
    await prisma.financialRecord.create({
      data: { amount: 800, type: 'INCOME', category: 'Investment', date: new Date('2026-03-10'), notes: 'Dividend', createdById: admin.id },
    });
    // Expense records
    await prisma.financialRecord.create({
      data: { amount: 1200, type: 'EXPENSE', category: 'Rent', date: new Date('2026-03-01'), notes: 'Monthly rent', createdById: admin.id },
    });
    await prisma.financialRecord.create({
      data: { amount: 250, type: 'EXPENSE', category: 'Utilities', date: new Date('2026-03-05'), notes: 'Electric and water', createdById: admin.id },
    });
    await prisma.financialRecord.create({
      data: { amount: 150, type: 'EXPENSE', category: 'Groceries', date: new Date('2026-03-12'), notes: 'Weekly groceries', createdById: admin.id },
    });
    await prisma.financialRecord.create({
      data: { amount: 80, type: 'EXPENSE', category: 'Transportation', date: new Date('2026-03-20'), notes: 'Transit pass', createdById: admin.id },
    });
  }
}

beforeAll(async () => {
  await initializeTestDatabase();
  await seedTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});


