export enum Role {
  Viewer = 'viewer',
  Analyst = 'analyst',
  Admin = 'admin',
}

export const AllRoles = [Role.Viewer, Role.Analyst, Role.Admin];

export function isValidRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
}
