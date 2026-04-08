import { SchemaDefinition, CommonRules, ValidationRule } from './validate-request.js';

export const loginSchema: SchemaDefinition = {
  email: {
    rules: [CommonRules.nonEmptyString(), CommonRules.email()],
  },
  password: {
    rules: [CommonRules.nonEmptyString()],
  },
};

const passwordMinLengthRule: ValidationRule = {
  validate: (v) => typeof v === 'string' && v.length >= 8,
  message: 'must be at least 8 characters',
};

export const signupSchema: SchemaDefinition = {
  name: {
    rules: [CommonRules.nonEmptyString()],
  },
  email: {
    rules: [CommonRules.nonEmptyString(), CommonRules.email()],
  },
  password: {
    rules: [CommonRules.nonEmptyString(), passwordMinLengthRule],
  },
};
