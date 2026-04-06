export enum RecordType {
  Income = 'income',
  Expense = 'expense',
}

export const AllRecordTypes = [RecordType.Income, RecordType.Expense];

export function isValidRecordType(value: unknown): value is RecordType {
  return Object.values(RecordType).includes(value as RecordType);
}
