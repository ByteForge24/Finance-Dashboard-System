import rateLimit from 'express-rate-limit';

// ---------------------------------------------------------------------------
// Rate Limiting
// Protects against brute-force attacks and API abuse.
// ---------------------------------------------------------------------------

/**
 * Global rate limiter — applied to all routes.
 * 100 requests per 15 minutes per IP.
 * Disabled in test environment to avoid rate limit issues during test execution.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  // Skip in test environment
  skip: (req) => process.env.NODE_ENV === 'test' ||
    (req.method === 'GET' &&
    typeof req.path === 'string' &&
    req.path.startsWith('/api/v1/dashboard/')),
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
 * Disabled in test environment to avoid rate limit issues during test execution.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  // Only count failed login attempts (status >= 400)
  skipSuccessfulRequests: true,
});

/**
 * Signup rate limiter — applied only to the signup endpoint.
 * 10 attempts per hour per IP.
 * Disabled in test environment to avoid rate limit issues during test execution.
 */
export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many signup attempts, please try again after 1 hour.',
  },
  // Only count failed signup attempts (status >= 400)
  skipSuccessfulRequests: true,
});
