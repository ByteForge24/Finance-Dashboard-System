import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// CORS Middleware
// Reads allowed origins from CORS_ORIGIN env var (comma-separated).
// Example: CORS_ORIGIN=http://localhost:5500,https://app.example.com
//
// If CORS_ORIGIN is not set, falls back to '*' ONLY when NODE_ENV !== 'production'.
// In production without CORS_ORIGIN, all cross-origin requests are blocked.
// ---------------------------------------------------------------------------

const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return [];
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();
const isProduction = process.env.NODE_ENV === 'production';

function resolveOrigin(requestOrigin: string | undefined): string | null {
  // If explicit origins are configured, validate against the whitelist
  if (allowedOrigins.length > 0) {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return null; // Origin not allowed
  }

  // No CORS_ORIGIN configured
  if (isProduction) {
    return null; // Block everything in production if not configured
  }

  // Development fallback: allow all origins
  return '*';
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestOrigin = req.headers.origin;
  const origin = resolveOrigin(requestOrigin);

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);

    // If using specific origins (not *), allow credentials
    if (origin !== '*') {
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    // Vary on Origin so caches don't serve wrong CORS headers
    res.header('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    // Always respond to preflight, even without CORS headers.
    // The browser will block the actual request if headers are missing.
    res.sendStatus(origin ? 200 : 204);
    return;
  }

  next();
}
