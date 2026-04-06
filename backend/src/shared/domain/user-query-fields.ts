export const USER_QUERY_FIELDS = {
  email: 'email',
  status: 'status',
  role: 'role',
} as const;

export type UserQueryField = typeof USER_QUERY_FIELDS[keyof typeof USER_QUERY_FIELDS];

export const USER_INDEXED_FIELDS = [USER_QUERY_FIELDS.email] as const;

export const USER_FILTERABLE_FIELDS = [
  USER_QUERY_FIELDS.email,
  USER_QUERY_FIELDS.status,
  USER_QUERY_FIELDS.role,
] as const;
