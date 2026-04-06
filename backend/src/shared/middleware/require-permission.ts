import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../access-control/permission-matrix.js';
import { PermissionActionValue } from '../access-control/permission-action.js';
import { sendForbidden, sendUnauthorized } from '../errors/api-error-response.js';
import { getAuthenticatedUser } from './authenticated-request.js';

export function requirePermission(action: PermissionActionValue) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getAuthenticatedUser(req);

    if (!user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (!hasPermission(user.role, action)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
}
