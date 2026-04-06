import bcrypt from 'bcryptjs';
import { UserStatus as PrismaUserStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { toPublicUser } from '../../shared/domain/user-mappers.js';
import { UnauthorizedError, NotFoundError } from '../../shared/errors/index.js';
import { generateToken } from './auth.token.js';
import { toDomainUser } from './auth.mapper.js';
import { LoginRequest, AuthResponse, TokenPayload } from './auth.types.js';

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: request.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== PrismaUserStatus.ACTIVE) {
    throw new UnauthorizedError('User account is inactive');
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
