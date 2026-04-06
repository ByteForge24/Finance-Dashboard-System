import { SchemaDefinition, CommonRules } from './validate-request.js';

export const loginSchema: SchemaDefinition = {
  email: {
    rules: [CommonRules.nonEmptyString(), CommonRules.email()],
  },
  password: {
    rules: [CommonRules.nonEmptyString()],
  },
};
