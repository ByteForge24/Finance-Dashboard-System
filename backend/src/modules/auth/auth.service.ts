import bcrypt from 'bcryptjs';
import { UserStatus as PrismaUserStatus, Role as PrismaRole } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { toPublicUser } from '../../shared/domain/user-mappers.js';
import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { generateToken } from './auth.token.js';
import { toDomainUser } from './auth.mapper.js';
import { LoginRequest, SignupRequest, AuthResponse, TokenPayload } from './auth.types.js';

// Reserved demo email addresses that cannot be used for signup
const RESERVED_DEMO_EMAILS = [
  'admin@finance-dashboard.local',
  'analyst@finance-dashboard.local',
  'viewer@finance-dashboard.local',
  'inactive@finance-dashboard.local',
];

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: request.email },
  });

  // Differentiated error: user not found
  if (!user) {
    throw new UnauthorizedError('User not found. Please sign up first.');
  }

  // Differentiated error: password validation
  const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Incorrect password. Please try again.');
  }

  // Differentiated error: inactive account
  if (user.status !== PrismaUserStatus.ACTIVE) {
    throw new UnauthorizedError('Account is inactive. Contact support.');
  }

  const domainUser = toDomainUser(user);

  const tokenPayload: TokenPayload = {
    userId: domainUser.id,
    email: domainUser.email,
    role: domainUser.role,
  };

  const token = generateToken(tokenPayload);
  const publicUser = toPublicUser(domainUser);

  return {
    user: publicUser,
    token,
  };
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
  const normalizedEmail = request.email.toLowerCase().trim();

  // Check if email is reserved for demo access
  if (RESERVED_DEMO_EMAILS.includes(normalizedEmail)) {
    throw new ConflictError('This email address is reserved for demo access');
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('Email address is already in use');
  }

  // Hash password with bcrypt (cost 10, same as existing auth strategy)
  const hashedPassword = await bcrypt.hash(request.password, 10);

  // Create new user with defaults: role=VIEWER, status=ACTIVE
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: request.name,
      passwordHash: hashedPassword,
      role: PrismaRole.VIEWER,
      status: PrismaUserStatus.ACTIVE,
    },
  });

  const domainUser = toDomainUser(user);

  const tokenPayload: TokenPayload = {
    userId: domainUser.id,
    email: domainUser.email,
    role: domainUser.role,
  };

  const token = generateToken(tokenPayload);
  const publicUser = toPublicUser(domainUser);

  return {
    user: publicUser,
    token,
  };
}

export async function getCurrentUserFromToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.status !== PrismaUserStatus.ACTIVE) {
    throw new UnauthorizedError('User account is inactive');
  }

  const domainUser = toDomainUser(user);
  return toPublicUser(domainUser);
}
