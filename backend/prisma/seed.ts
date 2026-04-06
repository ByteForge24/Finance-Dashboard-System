import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { Role, UserStatus, RecordType } from '@prisma/client';

const adminPasswordHash = bcrypt.hashSync('AdminPassword123', 10);
const analystPasswordHash = bcrypt.hashSync('AnalystPassword123', 10);
const viewerPasswordHash = bcrypt.hashSync('ViewerPassword123', 10);
const inactivePasswordHash = bcrypt.hashSync('InactivePassword123', 10);

async function main() {
  console.log('Seeding database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance-dashboard.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@finance-dashboard.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance-dashboard.local' },
    update: {},
    create: {
      name: 'Analyst User',
      email: 'analyst@finance-dashboard.local',
      passwordHash: analystPasswordHash,
      role: Role.ANALYST,
      status: UserStatus.ACTIVE,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finance-dashboard.local' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@finance-dashboard.local',
      passwordHash: viewerPasswordHash,
      role: Role.VIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  const inactive = await prisma.user.upsert({
    where: { email: 'inactive@finance-dashboard.local' },
    update: {},
    create: {
      name: 'Inactive User',
      email: 'inactive@finance-dashboard.local',
      passwordHash: inactivePasswordHash,
      role: Role.VIEWER,
      status: UserStatus.INACTIVE,
    },
  });

  // Clean up old records
  await prisma.financialRecord.deleteMany({
    where: { createdById: admin.id },
  });

  // ==================== JANUARY 2026 DATA (historical for trends) ====================
  const januaryIncomeRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 4800,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-01-01'),
        notes: 'Monthly salary - January',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 1100,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-01-15'),
        notes: 'Freelance project',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 600,
        type: RecordType.INCOME,
        category: 'Investment',
        date: new Date('2026-01-10'),
        notes: 'Dividend payment',
        createdById: admin.id,
      },
    }),
  ]);

  const januaryExpenseRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 1200,
        type: RecordType.EXPENSE,
        category: 'Rent',
        date: new Date('2026-01-01'),
        notes: 'Monthly rent - January',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 280,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-01-05'),
        notes: 'Electric and water',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 320,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-01-08'),
        notes: 'Weekly groceries',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 750,
        type: RecordType.EXPENSE,
        category: 'Entertainment',
        date: new Date('2026-01-18'),
        notes: 'Concert tickets and dinner',
        createdById: admin.id,
      },
    }),
  ]);

  // ==================== FEBRUARY 2026 DATA (historical for trends) ====================
  const februaryIncomeRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 5000,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-02-01'),
        notes: 'Monthly salary - February',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 1300,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-02-12'),
        notes: 'Freelance consulting work',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 700,
        type: RecordType.INCOME,
        category: 'Investment',
        date: new Date('2026-02-10'),
        notes: 'Dividend and interest',
        createdById: admin.id,
      },
    }),
  ]);

  const februaryExpenseRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 1200,
        type: RecordType.EXPENSE,
        category: 'Rent',
        date: new Date('2026-02-01'),
        notes: 'Monthly rent - February',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 265,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-02-05'),
        notes: 'Utilities bill',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 410,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-02-08'),
        notes: 'Weekly shopping',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 195,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-02-14'),
        notes: 'Restaurant - Valentines Day',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 450,
        type: RecordType.EXPENSE,
        category: 'Shopping',
        date: new Date('2026-02-20'),
        notes: 'Clothing and accessories',
        createdById: admin.id,
      },
    }),
  ]);

  // ==================== MARCH 2026 DATA (for comparison feature & last month) ====================
  const marchIncomeRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 5000,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-03-01'),
        notes: 'Monthly salary',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 900,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-03-15'),
        notes: 'Freelance project - Website redesign',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 650,
        type: RecordType.INCOME,
        category: 'Investment',
        date: new Date('2026-03-10'),
        notes: 'ETF dividend payment',
        createdById: admin.id,
      },
    }),
  ]);

  const marchExpenseRecords = await Promise.all([
    prisma.financialRecord.create({
      data: {
        amount: 1200,
        type: RecordType.EXPENSE,
        category: 'Rent',
        date: new Date('2026-03-01'),
        notes: 'Monthly apartment rent',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 280,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-03-05'),
        notes: 'Electric and water',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 320,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-03-08'),
        notes: 'Weekly groceries - Whole Foods',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 250,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-03-15'),
        notes: 'Weekly groceries - Costco',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 120,
        type: RecordType.EXPENSE,
        category: 'Transportation',
        date: new Date('2026-03-02'),
        notes: 'Monthly transit pass',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 85,
        type: RecordType.EXPENSE,
        category: 'Transportation',
        date: new Date('2026-03-22'),
        notes: 'Uber rides',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 180,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-03-12'),
        notes: 'Restaurant dinner with friends',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 95,
        type: RecordType.EXPENSE,
        category: 'Entertainment',
        date: new Date('2026-03-18'),
        notes: 'Movie tickets and snacks',
        createdById: admin.id,
      },
    }),
  ]);

  // ==================== APRIL 2026 DATA (current month - comprehensive for all features) ====================
  const aprilIncomeRecords = await Promise.all([
    // Salary (main income)
    prisma.financialRecord.create({
      data: {
        amount: 5500,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-04-01'),
        notes: 'Monthly salary - April',
        createdById: admin.id,
      },
    }),
    // Bonus (significant income source)
    prisma.financialRecord.create({
      data: {
        amount: 2000,
        type: RecordType.INCOME,
        category: 'Bonus',
        date: new Date('2026-04-05'),
        notes: 'Performance bonus - Q1',
        createdById: admin.id,
      },
    }),
    // Freelance work (multiple projects)
    prisma.financialRecord.create({
      data: {
        amount: 1500,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-04-08'),
        notes: 'Freelance project - Mobile app design',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 800,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-04-20'),
        notes: 'Freelance consulting - Social media strategy',
        createdById: admin.id,
      },
    }),
    // Investment income
    prisma.financialRecord.create({
      data: {
        amount: 750,
        type: RecordType.INCOME,
        category: 'Investment',
        date: new Date('2026-04-10'),
        notes: 'Dividend payment - ETF holdings',
        createdById: admin.id,
      },
    }),
    // Gifts/Other income
    prisma.financialRecord.create({
      data: {
        amount: 200,
        type: RecordType.INCOME,
        category: 'Gift',
        date: new Date('2026-04-15'),
        notes: 'Birthday gift from family',
        createdById: admin.id,
      },
    }),
  ]);

  const aprilExpenseRecords = await Promise.all([
    // Rent (largest expense)
    prisma.financialRecord.create({
      data: {
        amount: 1200,
        type: RecordType.EXPENSE,
        category: 'Rent',
        date: new Date('2026-04-01'),
        notes: 'Monthly apartment rent - April',
        createdById: admin.id,
      },
    }),
    // Utilities
    prisma.financialRecord.create({
      data: {
        amount: 310,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-04-05'),
        notes: 'Electric, water, gas fees',
        createdById: admin.id,
      },
    }),
    // Internet & Phone
    prisma.financialRecord.create({
      data: {
        amount: 95,
        type: RecordType.EXPENSE,
        category: 'Subscriptions',
        date: new Date('2026-04-01'),
        notes: 'Internet and phone bill',
        createdById: admin.id,
      },
    }),
    // Groceries (multiple trips)
    prisma.financialRecord.create({
      data: {
        amount: 345,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-04-06'),
        notes: 'Weekly groceries - Whole Foods',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 280,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-04-13'),
        notes: 'Weekly groceries - Costco',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 220,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-04-20'),
        notes: 'Weekly groceries - Trader Joes',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 150,
        type: RecordType.EXPENSE,
        category: 'Groceries',
        date: new Date('2026-04-27'),
        notes: 'Weekly groceries - Local market',
        createdById: admin.id,
      },
    }),
    // Transportation
    prisma.financialRecord.create({
      data: {
        amount: 120,
        type: RecordType.EXPENSE,
        category: 'Transportation',
        date: new Date('2026-04-01'),
        notes: 'Monthly transit pass',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 65,
        type: RecordType.EXPENSE,
        category: 'Transportation',
        date: new Date('2026-04-12'),
        notes: 'Uber rides - work commute',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 45,
        type: RecordType.EXPENSE,
        category: 'Transportation',
        date: new Date('2026-04-25'),
        notes: 'Gas fill-up',
        createdById: admin.id,
      },
    }),
    // Dining & Restaurants
    prisma.financialRecord.create({
      data: {
        amount: 220,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-04-03'),
        notes: 'Dinner with colleagues - Italian restaurant',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 145,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-04-10'),
        notes: 'Date night - Steakhouse',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 65,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-04-18'),
        notes: 'Lunch with friend',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 35,
        type: RecordType.EXPENSE,
        category: 'Dining',
        date: new Date('2026-04-25'),
        notes: 'Coffee and pastry',
        createdById: admin.id,
      },
    }),
    // Entertainment
    prisma.financialRecord.create({
      data: {
        amount: 125,
        type: RecordType.EXPENSE,
        category: 'Entertainment',
        date: new Date('2026-04-07'),
        notes: 'Concert tickets',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 55,
        type: RecordType.EXPENSE,
        category: 'Entertainment',
        date: new Date('2026-04-15'),
        notes: 'Movie tickets and snacks',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 40,
        type: RecordType.EXPENSE,
        category: 'Entertainment',
        date: new Date('2026-04-22'),
        notes: 'Video game purchase',
        createdById: admin.id,
      },
    }),
    // Healthcare
    prisma.financialRecord.create({
      data: {
        amount: 150,
        type: RecordType.EXPENSE,
        category: 'Healthcare',
        date: new Date('2026-04-09'),
        notes: 'Doctor visit co-pay',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 60,
        type: RecordType.EXPENSE,
        category: 'Healthcare',
        date: new Date('2026-04-16'),
        notes: 'Pharmacy - prescription',
        createdById: admin.id,
      },
    }),
    // Subscriptions (additional to internet)
    prisma.financialRecord.create({
      data: {
        amount: 99,
        type: RecordType.EXPENSE,
        category: 'Subscriptions',
        date: new Date('2026-04-02'),
        notes: 'Streaming service - Netflix, Spotify, Prime',
        createdById: admin.id,
      },
    }),
    // Shopping/Personal
    prisma.financialRecord.create({
      data: {
        amount: 175,
        type: RecordType.EXPENSE,
        category: 'Shopping',
        date: new Date('2026-04-11'),
        notes: 'Clothing and accessories',
        createdById: admin.id,
      },
    }),
    prisma.financialRecord.create({
      data: {
        amount: 85,
        type: RecordType.EXPENSE,
        category: 'Shopping',
        date: new Date('2026-04-21'),
        notes: 'Personal care items',
        createdById: admin.id,
      },
    }),
  ]);

  const incomeRecords = [...januaryIncomeRecords, ...februaryIncomeRecords, ...marchIncomeRecords, ...aprilIncomeRecords];
  const expenseRecords = [...januaryExpenseRecords, ...februaryExpenseRecords, ...marchExpenseRecords, ...aprilExpenseRecords];

  console.log('\n✅ Seeding completed with comprehensive multi-month test data!\n');
  console.log('=== User Accounts ===');
  console.log(`✓ Demo user: viewer@finance-dashboard.local (Password: ViewerPassword123)`);
  console.log(`✓ Admin user: admin@finance-dashboard.local (Password: AdminPassword123)`);
  console.log(`✓ Analyst user: analyst@finance-dashboard.local (Password: AnalystPassword123)`);
  console.log(`✓ Inactive user: inactive@finance-dashboard.local (Password: InactivePassword123)`);
  
  console.log('\n=== Financial Records Created ===');
  console.log(`✓ Total Income Records: ${incomeRecords.length}`);
  console.log(`  - January 2026: 3 records`);
  console.log(`  - February 2026: 3 records`);
  console.log(`  - March 2026: 3 records`);
  console.log(`  - April 2026: 6 records`);
  console.log(`✓ Total Expense Records: ${expenseRecords.length}`);
  console.log(`  - January 2026: 4 records`);
  console.log(`  - February 2026: 5 records`);
  console.log(`  - March 2026: 9 records`);
  console.log(`  - April 2026: 29 records`);
  
  const aprilIncome = aprilIncomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const aprilExpense = aprilExpenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const marchIncome = marchIncomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const marchExpense = marchExpenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const februaryIncome = februaryIncomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const februaryExpense = februaryExpenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const januaryIncome = januaryIncomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);
  const januaryExpense = januaryExpenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0);

  console.log('\n=== Monthly Summaries ===');
  console.log(`📊 April 2026 (Current Month):`);
  console.log(`   Income: $${aprilIncome} | Expense: $${aprilExpense} | Net: $${aprilIncome - aprilExpense}`);
  console.log(`   Savings Rate: ${Math.round(((aprilIncome - aprilExpense) / aprilIncome) * 100)}%`);
  
  console.log(`📊 March 2026 (Last Month):`);
  console.log(`   Income: $${marchIncome} | Expense: $${marchExpense} | Net: $${marchIncome - marchExpense}`);
  console.log(`   Savings Rate: ${Math.round(((marchIncome - marchExpense) / marchIncome) * 100)}%`);
  
  console.log(`📊 February 2026:`);
  console.log(`   Income: $${februaryIncome} | Expense: $${februaryExpense} | Net: $${februaryIncome - februaryExpense}`);
  
  console.log(`📊 January 2026:`);
  console.log(`   Income: $${januaryIncome} | Expense: $${januaryExpense} | Net: $${januaryIncome - januaryExpense}`);
  
  console.log('\n=== Features to Test ===');
  console.log(`✓ Dashboard Summary - Shows 4-month trends`);
  console.log(`✓ Recent Activity - View all transactions across months`);
  console.log(`✓ Category Breakdown - Multiple categories across all months`);
  console.log(`✓ Trends - 4 months of data to show progression`);
  console.log(`✓ Monthly Insights - April data with rich details`);
  console.log(`✓ Month Selector - Jump between any of 4+ months`);
  console.log(`✓ Month-over-Month - Compare April vs March`);
  console.log(`✓ Previous/Next Navigation - Navigate between months`);
  console.log(`✓ Last 7 Days - Shows recent transactions (Apr 1-6)`);
  console.log(`✓ Export CSV - Full report with all data`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
