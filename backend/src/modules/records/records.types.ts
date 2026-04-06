import { FinancialRecord } from '../../shared/domain/financial-record.js';

export interface CreateRecordInput {
  amount?: number;
  type?: string;
  category?: string;
  date?: string | Date;
  notes?: string | null;
}

export interface RecordServiceCreateInput {
  amount: number;
  type: string;
  category: string;
  date: Date;
  notes: string | null;
  createdById: string;
}

export interface ListRecordsFilters {
  type?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface ListRecordsServiceInput {
  filters: ListRecordsFilters;
  page: number;
  limit: number;
  sortBy?: 'date' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListRecordsServiceOutput {
  records: FinancialRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface RecordServiceUpdateInput {
  recordId: string;
  amount?: number;
  type?: string;
  category?: string;
  date?: Date;
  notes?: string | null;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SuggestionSource = 'ai' | 'fallback';

export interface SuggestCategoryInput {
  notes: string;
  type?: 'income' | 'expense';
  amount?: number;
}

export interface SuggestCategoryOutput {
  suggestedCategory: string | null;
  alternatives: string[];
  confidence: ConfidenceLevel;
  source: SuggestionSource;
  reason?: string;
}
