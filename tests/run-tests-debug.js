#!/usr/bin/env node
/**
 * Test runner with debugging output
 */
const { spawn } = require('child_process');
const path = require('path');

async function runTests() {
  const env = {
    ...process.env,
    PLAYWRIGHT_HEADED: 'true',
    DEBUG: 'pw:api',
  };

  return new Promise((resolve) => {
    const cmd = spawn('npx', [
      'playwright',
      'test',
      '--reporter=list',
      '--headed',
      '--workers=1',
      'e2e/frontend-auth-and-rbac.spec.ts',
    ], {
      cwd: __dirname,
      env,
      stdio: 'inherit',
    });

    cmd.on('close', (code) => {
      console.log(`\n\n=== Test exit code: ${code} ===`);
      resolve(code);
    });

    cmd.on('error', (err) => {
      console.error('Failed to start tests:', err);
      resolve(1);
    });
  });
}

runTests();
