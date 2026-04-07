import rateLimit from 'express-rate-limit';

// ---------------------------------------------------------------------------
// Rate Limiting
// Protects against brute-force attacks and API abuse.
// ---------------------------------------------------------------------------

/**
 * Global rate limiter — applied to all routes.
 * 100 requests per 15 minutes per IP.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  // Dashboard pages fan out into several concurrent GET requests; handle them
  // with a dedicated, softer limiter instead of the generic global one.
  skip: (req) =>
    req.method === 'GET' &&
    typeof req.path === 'string' &&
    req.path.startsWith('/api/v1/dashboard/'),
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Softer dashboard read limiter — allows normal page loads and refreshes
 * without tripping the global throttle.
 * 300 read requests per 15 minutes per IP.
 */
export const dashboardReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many dashboard requests, please try again later.',
  },
});

/**
 * Strict login rate limiter — applied only to the login endpoint.
 * 5 attempts per 15 minutes per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  // Only count failed login attempts (status >= 400)
  skipSuccessfulRequests: true,
});
