export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface FieldSchema {
  optional?: boolean;
  rules?: ValidationRule[];
}

export interface SchemaDefinition {
  [field: string]: FieldSchema;
}

export interface ErrorDetail {
  field: string;
  issue: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ErrorDetail[];
  data?: Record<string, unknown>;
}

export function validate(data: unknown, schema: SchemaDefinition): ValidationResult {
  const errors: ErrorDetail[] = [];
  const validated: Record<string, unknown> = {};

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ field: '_request', issue: 'must be an object' }],
    };
  }

  const input = data as Record<string, unknown>;

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = input[field];

    if (value === undefined || value === null) {
      if (!fieldSchema.optional) {
        errors.push({ field, issue: 'is required' });
      }
      continue;
    }

    if (fieldSchema.rules) {
      for (const rule of fieldSchema.rules) {
        if (!rule.validate(value)) {
          errors.push({ field, issue: rule.message });
          break;
        }
      }
    }

    validated[field] = value;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validated : undefined,
  };
}

export function validateQuery(
  query: Record<string, unknown>,
  schema: SchemaDefinition
): ValidationResult {
  const errors: ErrorDetail[] = [];
  const validated: Record<string, unknown> = {};

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = query[field];

    if (value === undefined || value === null || value === '') {
      if (!fieldSchema.optional) {
        errors.push({ field, issue: 'is required' });
      }
      continue;
    }

    if (fieldSchema.rules) {
      for (const rule of fieldSchema.rules) {
        if (!rule.validate(value)) {
          errors.push({ field, issue: rule.message });
          break;
        }
      }
    }

    validated[field] = value;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validated : undefined,
  };
}

export const CommonRules = {
  required: (): ValidationRule => ({
    validate: (v) => v !== null && v !== undefined && v !== '',
    message: 'is required',
  }),
  nonEmptyString: (): ValidationRule => ({
    validate: (v) => typeof v === 'string' && v.length > 0,
    message: 'must be a non-empty string',
  }),
  email: (): ValidationRule => ({
    validate: (v) => {
      if (typeof v !== 'string') return false;
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(v);
    },
    message: 'must be a valid email',
  }),
  positiveNumber: (): ValidationRule => ({
    validate: (v) => typeof v === 'number' && v > 0,
    message: 'must be a positive number',
  }),
  enum: (values: string[]): ValidationRule => ({
    validate: (v) => typeof v === 'string' && values.includes(v),
    message: `must be one of: ${values.join(', ')}`,
  }),
  dateString: (): ValidationRule => ({
    validate: (v) => {
      if (typeof v !== 'string') return false;
      const d = new Date(v);
      return !isNaN(d.getTime());
    },
    message: 'must be a valid date string',
  }),
  dateObject: (): ValidationRule => ({
    validate: (v) => v instanceof Date && !isNaN(v.getTime()),
    message: 'must be a valid date',
  }),
  numberInRange: (min: number, max: number): ValidationRule => ({
    validate: (v) => typeof v === 'number' && v >= min && v <= max,
    message: `must be between ${min} and ${max}`,
  }),
};
