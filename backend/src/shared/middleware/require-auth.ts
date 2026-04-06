import { Request, Response, NextFunction } from 'express';
import { sendUnauthorized } from '../errors/api-error-response.js';
import { getAuthenticatedUser } from './authenticated-request.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getAuthenticatedUser(req);

  if (!user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  next();
}
