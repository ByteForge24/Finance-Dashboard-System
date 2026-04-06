import { Request, Response, NextFunction } from 'express';
import { setAuthenticatedUser } from './authenticated-request.js';
import { verifyToken } from '../../modules/auth/auth.token.js';
import { getCurrentUserFromToken } from '../../modules/auth/auth.service.js';

export async function attachAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      next();
      return;
    }

    const publicUser = await getCurrentUserFromToken(payload.userId);

    setAuthenticatedUser(req, {
      id: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
      status: publicUser.status,
    });

    next();
  } catch {
    next();
  }
}
