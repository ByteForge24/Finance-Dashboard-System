import { Role } from '../domain/role.js';
import { PermissionAction, PermissionActionValue } from './permission-action.js';

const rolePermissions: Record<Role, readonly PermissionActionValue[]> = {
  [Role.Viewer]: [
    PermissionAction.auth.login,
    PermissionAction.auth.me,
    PermissionAction.dashboard.summary,
    PermissionAction.dashboard.categoryBreakdown,
    PermissionAction.dashboard.recentActivity,
    PermissionAction.dashboard.trends,
    PermissionAction.dashboard.monthlyInsights,
  ],

  [Role.Analyst]: [
    PermissionAction.auth.login,
    PermissionAction.auth.me,
    PermissionAction.records.list,
    PermissionAction.records.read,
    PermissionAction.records.suggestCategory,
    PermissionAction.dashboard.summary,
    PermissionAction.dashboard.categoryBreakdown,
    PermissionAction.dashboard.recentActivity,
    PermissionAction.dashboard.trends,
    PermissionAction.dashboard.monthlyInsights,
  ],

  [Role.Admin]: [
    PermissionAction.auth.login,
    PermissionAction.auth.me,
    PermissionAction.users.create,
    PermissionAction.users.list,
    PermissionAction.users.read,
    PermissionAction.users.update,
    PermissionAction.users.updateStatus,
    PermissionAction.users.updateRole,
    PermissionAction.records.create,
    PermissionAction.records.list,
    PermissionAction.records.read,
    PermissionAction.records.update,
    PermissionAction.records.delete,
    PermissionAction.records.suggestCategory,
    PermissionAction.dashboard.summary,
    PermissionAction.dashboard.categoryBreakdown,
    PermissionAction.dashboard.recentActivity,
    PermissionAction.dashboard.trends,
    PermissionAction.dashboard.monthlyInsights,
  ],
};

export function hasPermission(role: Role, action: PermissionActionValue): boolean {
  return rolePermissions[role].includes(action);
}

export function getAllowedActions(role: Role): readonly PermissionActionValue[] {
  return rolePermissions[role];
}
