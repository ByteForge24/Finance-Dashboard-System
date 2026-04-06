import express, { Express } from 'express';
import helmet from 'helmet';
import {
  corsMiddleware,
  requestLogger,
  globalRateLimiter,
  notFoundHandler,
  errorHandler,
} from './shared/middleware/index.js';
import router from './routes/index.js';
import { initializeCategorySuggester } from './shared/integrations/index.js';

const app: Express = express();

// ---------------------------------------------------------------------------
// Initialize Category Suggester (available for all routes)
// This is done early so it's available for both runtime and tests
// ---------------------------------------------------------------------------
const categorySuggester = initializeCategorySuggester();
app.locals.categorySuggester = categorySuggester;

// ---------------------------------------------------------------------------
// Security headers (helmet) — must be early in the stack
// ---------------------------------------------------------------------------
app.use(
  helmet({
    // Content Security Policy: allow the CDN sources the frontend uses.
    // This only applies if the backend serves the frontend (e.g., in a
    // single-origin deployment). When frontend is served from a separate
    // origin, the frontend's own server should set CSP.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",        // Tailwind CDN uses inline scripts
          "'unsafe-eval'",          // Tailwind CDN requires eval
          'https://cdn.tailwindcss.com',
          'https://cdn.jsdelivr.net',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://fonts.googleapis.com',
        ],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: [
          "'self'",
          // Allow connections to both local and production servers
          'http://localhost:3000',
          'https://finance-dashboard-api-hqjk.onrender.com',
        ],
      },
    },
    // Cross-Origin-Embedder-Policy can break CDN fonts/scripts
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(corsMiddleware);

app.use(requestLogger);

app.use(globalRateLimiter);

app.use(router);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
