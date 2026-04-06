import { SchemaDefinition, CommonRules } from './validate-request.js';
import { AllRecordTypes } from '../domain/record-type.js';

export const createRecordSchema: SchemaDefinition = {
  amount: {
    rules: [CommonRules.positiveNumber()],
  },
  type: {
    rules: [CommonRules.enum(AllRecordTypes)],
  },
  category: {
    rules: [CommonRules.nonEmptyString()],
  },
  date: {
    rules: [
      {
        validate: (v) => {
          if (v instanceof Date) {
            return !isNaN(v.getTime());
          }
          if (typeof v === 'string') {
            const d = new Date(v);
            return !isNaN(d.getTime());
          }
          return false;
        },
        message: 'must be a valid date',
      },
    ],
  },
  notes: {
    optional: true,
    rules: [
      {
        validate: (v) => v === null || typeof v === 'string',
        message: 'must be a string or null',
      },
    ],
  },
};

export const updateRecordSchema: SchemaDefinition = {
  amount: {
    optional: true,
    rules: [CommonRules.positiveNumber()],
  },
  type: {
    optional: true,
    rules: [CommonRules.enum(AllRecordTypes)],
  },
  category: {
    optional: true,
    rules: [CommonRules.nonEmptyString()],
  },
  date: {
    optional: true,
    rules: [
      {
        validate: (v) => {
          if (v instanceof Date) {
            return !isNaN(v.getTime());
          }
          if (typeof v === 'string') {
            const d = new Date(v);
            return !isNaN(d.getTime());
          }
          return false;
        },
        message: 'must be a valid date',
      },
    ],
  },
  notes: {
    optional: true,
    rules: [
      {
        validate: (v) => v === null || typeof v === 'string',
        message: 'must be a string or null',
      },
    ],
  },
};

export const listRecordsSchema: SchemaDefinition = {
  startDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  endDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  type: {
    optional: true,
    rules: [CommonRules.enum(AllRecordTypes)],
  },
};

export const suggestCategorySchema: SchemaDefinition = {
  notes: {
    rules: [
      CommonRules.nonEmptyString(),
      {
        validate: (v) => typeof v === 'string' && v.length <= 1000,
        message: 'must be max 1000 characters',
      },
    ],
  },
  type: {
    optional: true,
    rules: [CommonRules.enum(['income', 'expense'])],
  },
  amount: {
    optional: true,
    rules: [CommonRules.positiveNumber()],
  },
};
