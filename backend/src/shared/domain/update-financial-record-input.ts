import { RecordType } from './record-type.js';

export interface UpdateFinancialRecordInput {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: Date;
  notes?: string | null;
}
