import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';

// ---------------------------------------------------------------------------
// Startup Environment Validation
// The server MUST NOT start without critical secrets. This prevents silent
// fallback to hardcoded values that would compromise security in production.
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const;

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error('\nCreate a .env file or set these variables before starting the server.');
  console.error('See .env.example for reference.\n');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------------
// Graceful Shutdown
// On SIGTERM/SIGINT: stop accepting new connections, close the DB pool,
// then exit. A timeout ensures the process doesn't hang indefinitely.
// ---------------------------------------------------------------------------
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return; // Prevent double-shutdown
  isShuttingDown = true;

  console.log(`\n🛑 ${signal} received — shutting down gracefully...`);

  // Force-exit failsafe
  const forceExitTimer = setTimeout(() => {
    console.error('⚠️  Shutdown timed out — forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref(); // Don't keep the event loop alive for this timer

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('   ✓ HTTP server closed');
  });

  // 2. Disconnect from the database
  try {
    await prisma.$disconnect();
    console.log('   ✓ Database disconnected');
  } catch (err) {
    console.error('   ✗ Error disconnecting database:', err);
  }

  console.log('   Shutdown complete.\n');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Unhandled Error Handlers
// Catch errors that escape all try/catch blocks. Without these, the process
// crashes silently (no log output) on unhandled rejections in Node 18+.
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason: unknown) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
  // Don't exit — let the process continue, but log for investigation.
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception — process is in an undefined state:', error);
  // The process is no longer reliable after an uncaught exception.
  // Shut down gracefully if possible, otherwise force-exit.
  shutdown('uncaughtException').catch(() => process.exit(1));
});
