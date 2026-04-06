import { User as PrismaUser, Role as PrismaRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import { User } from '../../shared/domain/user.js';
import { Role } from '../../shared/domain/role.js';
import { UserStatus } from '../../shared/domain/user-status.js';

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

export function toDomainUser(prismaUser: PrismaUser): User {
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
