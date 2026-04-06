import { RecordType } from './record-type.js';

export const RECORD_FILTER_KEYS = {
  startDate: 'startDate',
  endDate: 'endDate',
  category: 'category',
  type: 'type',
} as const;

export type RecordFilterKey = typeof RECORD_FILTER_KEYS[keyof typeof RECORD_FILTER_KEYS];

export interface RecordFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: RecordType;
}
