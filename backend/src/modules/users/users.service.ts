import bcrypt from 'bcryptjs';
import { User as PrismaUser, Role as PrismaRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { User } from '../../shared/domain/user.js';
import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import {
  UserServiceCreateInput,
  UserServiceUpdateInput,
  UserServiceUpdateStatusInput,
  UserServiceUpdateRoleInput,
} from './users.types.js';

function mapPrismaRole(prismaRole: PrismaRole): Role {
  const roleMap: Record<PrismaRole, Role> = {
    [PrismaRole.ADMIN]: Role.Admin,
    [PrismaRole.ANALYST]: Role.Analyst,
    [PrismaRole.VIEWER]: Role.Viewer,
  };
  return roleMap[prismaRole];
}

function mapPrismaUserStatus(prismaStatus: PrismaUserStatus): UserStatus {
  const statusMap: Record<PrismaUserStatus, UserStatus> = {
    [PrismaUserStatus.ACTIVE]: UserStatus.Active,
    [PrismaUserStatus.INACTIVE]: UserStatus.Inactive,
  };
  return statusMap[prismaStatus];
}

function mapDomainRoleToPrisma(role: Role): PrismaRole {
  const roleMap: Record<Role, PrismaRole> = {
    [Role.Admin]: PrismaRole.ADMIN,
    [Role.Analyst]: PrismaRole.ANALYST,
    [Role.Viewer]: PrismaRole.VIEWER,
  };
  return roleMap[role];
}

function mapDomainUserStatusToPrisma(status: UserStatus): PrismaUserStatus {
  const statusMap: Record<UserStatus, PrismaUserStatus> = {
    [UserStatus.Active]: PrismaUserStatus.ACTIVE,
    [UserStatus.Inactive]: PrismaUserStatus.INACTIVE,
  };
  return statusMap[status];
}

function toDomainUser(prismaUser: PrismaUser): User {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    passwordHash: prismaUser.passwordHash,
    role: mapPrismaRole(prismaUser.role),
    status: mapPrismaUserStatus(prismaUser.status),
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

export async function createUser(input: UserServiceCreateInput): Promise<User> {
  const normalizedEmail = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('Email address is already in use');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: input.name,
      passwordHash: hashedPassword,
      role: mapDomainRoleToPrisma(input.role),
      status: mapDomainUserStatusToPrisma(input.status),
    },
  });

  return toDomainUser(user);
}

export async function listUsers(input?: { search?: string }): Promise<User[]> {
  const whereClause: any = {};
  if (input?.search) {
    const s = input.search;
    whereClause.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { role: { equals: s === 'admin' ? PrismaRole.ADMIN : s === 'analyst' ? PrismaRole.ANALYST : s === 'viewer' ? PrismaRole.VIEWER : undefined } }
    ];
    // Remove undefined role query if it wasn't a role exact match
    if (!whereClause.OR[2].role.equals) {
        whereClause.OR.pop();
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(toDomainUser);
}

export async function getUserById(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return toDomainUser(user);
}

export async function updateUser(userId: string, input: UserServiceUpdateInput): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updateData: Record<string, unknown> = {};

  if (input.email !== undefined) {
    const normalizedEmail = input.email.toLowerCase();

    if (normalizedEmail !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictError('Email address is already in use');
      }
    }

    updateData.email = normalizedEmail;
  }

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return toDomainUser(updatedUser);
}

export async function updateUserStatus(userId: string, input: UserServiceUpdateStatusInput): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: mapDomainUserStatusToPrisma(input.status),
    },
  });

  return toDomainUser(updatedUser);
}

export async function updateUserRole(userId: string, input: UserServiceUpdateRoleInput): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: mapDomainRoleToPrisma(input.role),
    },
  });

  return toDomainUser(updatedUser);
}
