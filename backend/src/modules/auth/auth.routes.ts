import { Router, Request, Response } from 'express';
import { sendSuccess, sendValidationError, asyncHandler } from '../../shared/utils/index.js';
import { extractBearerToken } from '../../shared/utils/index.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { loginRateLimiter, signupRateLimiter } from '../../shared/middleware/index.js';
import { login, signup, getCurrentUserFromToken } from './auth.service.js';
import { verifyToken } from './auth.token.js';
import { LoginRequest, SignupRequest } from './auth.types.js';
import { validate, loginSchema, signupSchema } from '../../shared/validation/index.js';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body: LoginRequest = req.body;

    const result = validate(body, loginSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const authResponse = await login({
      email: (result.data!.email as string).toLowerCase(),
      password: result.data!.password as string,
    });

    return sendSuccess(res, authResponse, 200);
  })
);

router.post(
  '/signup',
  signupRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body: SignupRequest = req.body;

    const result = validate(body, signupSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const authResponse = await signup({
      name: result.data!.name as string,
      email: (result.data!.email as string).toLowerCase().trim(),
      password: result.data!.password as string,
    });

    return sendSuccess(res, authResponse, 201);
  })
);

router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.get('Authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const tokenPayload = verifyToken(token);

    if (!tokenPayload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await getCurrentUserFromToken(tokenPayload.userId);

    return sendSuccess(res, user, 200);
  })
);

export default router;
