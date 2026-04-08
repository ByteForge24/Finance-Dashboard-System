#!/usr/bin/env node
/**
 * Run all Playwright test specs and generate a summary
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const specs = [
  'e2e/frontend-auth-and-rbac.spec.ts',
  'e2e/api-security-and-integrity.spec.ts',
  'e2e/frontend-dashboard-detailed.spec.ts',
  'e2e/frontend-records-detailed.spec.ts',
  'e2e/frontend-ux-and-mobile.spec.ts',
  'e2e/production-writes.optional.spec.ts',
  'e2e/backend-user-management.optional.spec.ts',
  'e2e/backend-record-lifecycle.optional.spec.ts',
];

async function runSpec(spec) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${spec}`);
    console.log('='.repeat(60));

    const cmd = spawn('npx', ['playwright', 'test', spec, '--workers=1', '--reporter=list'], {
      cwd: __dirname,
      stdio: 'inherit',
    });

    cmd.on('close', (code) => {
      resolve({ spec, exitCode: code, passed: code === 0 });
    });
  });
}

async function run() {
  console.log('\n🧪 PRODUCTION E2E TEST SUITE RUNNER\n');
  
  const results = [];
  
  for (const spec of specs) {
    try {
      const result = await runSpec(spec);
      results.push(result);
    } catch (err) {
      console.error(`Error running ${spec}:`, err.message);
      results.push({ spec, exitCode: 1, passed: false, error: err.message });
    }
  }

  // Print summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(60));

  results.forEach((r) => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL/SKIP';
    console.log(`${status} | ${r.spec}`);
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
}

run();
