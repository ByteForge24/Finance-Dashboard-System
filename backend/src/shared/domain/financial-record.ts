import { RecordType } from './record-type.js';
import type { CreatorReference } from './creator-reference.js';
import type { FinancialRecordId } from './financial-record-id.js';

export interface FinancialRecord {
  id: FinancialRecordId;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  createdBy: CreatorReference;
  createdAt: Date;
  updatedAt: Date;
}
