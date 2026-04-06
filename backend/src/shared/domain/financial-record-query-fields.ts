export const FINANCIAL_RECORD_QUERY_FIELDS = {
  date: 'date',
  type: 'type',
  category: 'category',
  createdBy: 'createdBy',
} as const;

export type FinancialRecordQueryField =
  typeof FINANCIAL_RECORD_QUERY_FIELDS[keyof typeof FINANCIAL_RECORD_QUERY_FIELDS];

export const FINANCIAL_RECORD_INDEXED_FIELDS = [
  FINANCIAL_RECORD_QUERY_FIELDS.date,
  FINANCIAL_RECORD_QUERY_FIELDS.type,
  FINANCIAL_RECORD_QUERY_FIELDS.category,
] as const;

export const FINANCIAL_RECORD_FILTERABLE_FIELDS = [
  FINANCIAL_RECORD_QUERY_FIELDS.date,
  FINANCIAL_RECORD_QUERY_FIELDS.type,
  FINANCIAL_RECORD_QUERY_FIELDS.category,
  FINANCIAL_RECORD_QUERY_FIELDS.createdBy,
] as const;
