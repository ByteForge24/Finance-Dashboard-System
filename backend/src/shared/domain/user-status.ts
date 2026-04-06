export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export const AllUserStatuses = [UserStatus.Active, UserStatus.Inactive];

export function isValidUserStatus(value: unknown): value is UserStatus {
  return Object.values(UserStatus).includes(value as UserStatus);
}
