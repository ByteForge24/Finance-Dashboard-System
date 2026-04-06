export const PermissionAction = {
  auth: {
    login: 'auth.login',
    me: 'auth.me',
  },
  users: {
    create: 'users.create',
    list: 'users.list',
    read: 'users.read',
    update: 'users.update',
    updateStatus: 'users.updateStatus',
    updateRole: 'users.updateRole',
  },
  records: {
    create: 'records.create',
    list: 'records.list',
    read: 'records.read',
    update: 'records.update',
    delete: 'records.delete',
    suggestCategory: 'records.suggestCategory',
  },
  dashboard: {
    summary: 'dashboard.summary',
    categoryBreakdown: 'dashboard.categoryBreakdown',
    recentActivity: 'dashboard.recentActivity',
    trends: 'dashboard.trends',
    monthlyInsights: 'dashboard.monthlyInsights',
  },
} as const;

export type PermissionActionValue = 
  | typeof PermissionAction.auth.login
  | typeof PermissionAction.auth.me
  | typeof PermissionAction.users.create
  | typeof PermissionAction.users.list
  | typeof PermissionAction.users.read
  | typeof PermissionAction.users.update
  | typeof PermissionAction.users.updateStatus
  | typeof PermissionAction.users.updateRole
  | typeof PermissionAction.records.create
  | typeof PermissionAction.records.list
  | typeof PermissionAction.records.read
  | typeof PermissionAction.records.update
  | typeof PermissionAction.records.delete
  | typeof PermissionAction.records.suggestCategory
  | typeof PermissionAction.dashboard.summary
  | typeof PermissionAction.dashboard.categoryBreakdown
  | typeof PermissionAction.dashboard.recentActivity
  | typeof PermissionAction.dashboard.trends
  | typeof PermissionAction.dashboard.monthlyInsights;
