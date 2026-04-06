import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '../domain/user-status.js';
import { sendUnauthorized } from '../errors/api-error-response.js';
import { getAuthenticatedUser } from './authenticated-request.js';

export function requireActiveUser(req: Request, res: Response, next: NextFunction): void {
  const user = getAuthenticatedUser(req);

  if (!user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  if (user.status !== UserStatus.Active) {
    sendUnauthorized(res, 'User account is inactive');
    return;
  }

  next();
}
