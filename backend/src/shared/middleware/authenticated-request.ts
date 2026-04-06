import { Request } from 'express';
import { Role } from '../domain/role.js';
import { UserStatus } from '../domain/user-status.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function getAuthenticatedUser(req: Request): AuthenticatedUser | undefined {
  return req.user;
}

export function setAuthenticatedUser(req: Request, user: AuthenticatedUser): void {
  req.user = user;
}
