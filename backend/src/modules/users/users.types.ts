import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';

export interface CreateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  status?: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
}

export interface UpdateUserStatusRequest {
  status?: string;
}

export interface UpdateUserRoleRequest {
  role?: string;
}

export interface UserServiceCreateInput {
  email: string;
  name: string;
  password: string;
  role: Role;
  status: UserStatus;
}

export interface UserServiceUpdateInput {
  email?: string;
  name?: string;
}

export interface UserServiceUpdateStatusInput {
  status: UserStatus;
}

export interface UserServiceUpdateRoleInput {
  role: Role;
}
