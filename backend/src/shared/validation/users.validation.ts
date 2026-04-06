import { SchemaDefinition, CommonRules } from './validate-request.js';
import { AllRoles } from '../domain/role.js';
import { AllUserStatuses } from '../domain/user-status.js';

export const createUserSchema: SchemaDefinition = {
  email: {
    rules: [CommonRules.nonEmptyString(), CommonRules.email()],
  },
  name: {
    rules: [CommonRules.nonEmptyString()],
  },
  password: {
    rules: [CommonRules.nonEmptyString()],
  },
  role: {
    rules: [CommonRules.enum(AllRoles)],
  },
  status: {
    rules: [CommonRules.enum(AllUserStatuses)],
  },
};

export const updateUserSchema: SchemaDefinition = {
  email: {
    optional: true,
    rules: [CommonRules.nonEmptyString(), CommonRules.email()],
  },
  name: {
    optional: true,
    rules: [CommonRules.nonEmptyString()],
  },
  password: {
    optional: true,
    rules: [CommonRules.nonEmptyString()],
  },
};

export const updateUserStatusSchema: SchemaDefinition = {
  status: {
    rules: [CommonRules.enum(AllUserStatuses)],
  },
};

export const updateUserRoleSchema: SchemaDefinition = {
  role: {
    rules: [CommonRules.enum(AllRoles)],
  },
};
