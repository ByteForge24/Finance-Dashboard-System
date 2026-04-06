import { Role } from './role.js';
import { UserStatus } from './user-status.js';
import type { UserId } from './user-id.js';

export interface User {
  id: UserId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
