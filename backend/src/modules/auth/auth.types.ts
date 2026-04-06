import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}
