import { RecordType as PrismaRecordType, FinancialRecord as PrismaFinancialRecord, Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { FinancialRecord } from '../../shared/domain/financial-record.js';
import { RecordType } from '../../shared/domain/record-type.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { RecordServiceCreateInput, ListRecordsFilters, ListRecordsServiceInput, ListRecordsServiceOutput, RecordServiceUpdateInput } from './records.types.js';

function mapPrismaRecordType(prismaType: PrismaRecordType): RecordType {
  const typeMap: Record<PrismaRecordType, RecordType> = {
    [PrismaRecordType.INCOME]: RecordType.Income,
    [PrismaRecordType.EXPENSE]: RecordType.Expense,
  };
  return typeMap[prismaType];
}

function mapDomainRecordTypeToPrisma(type: RecordType): PrismaRecordType {
  const typeMap: Record<RecordType, PrismaRecordType> = {
    [RecordType.Income]: PrismaRecordType.INCOME,
    [RecordType.Expense]: PrismaRecordType.EXPENSE,
  };
  return typeMap[type];
}

function toDomainRecord(prismaRecord: PrismaFinancialRecord): FinancialRecord {
  return {
    id: prismaRecord.id,
    amount: Number(prismaRecord.amount),
    type: mapPrismaRecordType(prismaRecord.type),
    category: prismaRecord.category,
    date: prismaRecord.date,
    notes: prismaRecord.notes,
    createdBy: prismaRecord.createdById,
    createdAt: prismaRecord.createdAt,
    updatedAt: prismaRecord.updatedAt,
  };
}

export async function createRecord(input: RecordServiceCreateInput): Promise<FinancialRecord> {
  const prismaRecord = await prisma.financialRecord.create({
    data: {
      amount: input.amount,
      type: mapDomainRecordTypeToPrisma(input.type as RecordType),
      category: input.category,
      date: input.date,
      notes: input.notes,
      createdById: input.createdById,
    },
  });

  return toDomainRecord(prismaRecord);
}

export async function getRecordById(recordId: string): Promise<FinancialRecord> {
  const record = await prisma.financialRecord.findUnique({
    where: { id: recordId },
  });

  if (!record || record.deletedAt !== null) {
    throw new NotFoundError('Record not found');
  }

  return toDomainRecord(record);
}

export async function listRecords(input: ListRecordsServiceInput): Promise<ListRecordsServiceOutput> {
  const whereClause: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
  };

  if (input.filters.type) {
    whereClause.type = input.filters.type === 'income' ? PrismaRecordType.INCOME : PrismaRecordType.EXPENSE;
  }

  if (input.filters.category) {
    whereClause.category = input.filters.category;
  }

  if (input.filters.startDate || input.filters.endDate) {
    whereClause.date = {};
    if (input.filters.startDate) {
      whereClause.date.gte = input.filters.startDate;
    }
    if (input.filters.endDate) {
      whereClause.date.lte = input.filters.endDate;
    }
  }

  if (input.filters.search) {
    whereClause.OR = [
      { category: { contains: input.filters.search, mode: 'insensitive' } },
      { notes: { contains: input.filters.search, mode: 'insensitive' } },
    ];
  }

  // Calculate offset
  const offset = (input.page - 1) * input.limit;

  // Determine sort field and order
  const sortBy = input.sortBy || 'date';
  const sortOrder = input.sortOrder || 'desc';

  // Query total count for pagination metadata
  const total = await prisma.financialRecord.count({
    where: whereClause,
  });

  // Query records with pagination and sorting
  const prismaRecords = await prisma.financialRecord.findMany({
    where: whereClause,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: offset,
    take: input.limit,
  });

  // Map records to domain model
  const records = prismaRecords.map(toDomainRecord);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / input.limit);
  const hasNextPage = input.page < totalPages;
  const hasPreviousPage = input.page > 1;

  return {
    records,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

export async function updateRecord(input: RecordServiceUpdateInput): Promise<FinancialRecord> {
  const existing = await prisma.financialRecord.findUnique({
    where: { id: input.recordId },
  });

  if (!existing || existing.deletedAt !== null) {
    throw new NotFoundError('Record not found');
  }

  const updateData: Prisma.FinancialRecordUpdateInput = {};

  if (input.amount !== undefined) {
    updateData.amount = input.amount;
  }

  if (input.type !== undefined) {
    updateData.type = input.type === 'income' ? PrismaRecordType.INCOME : PrismaRecordType.EXPENSE;
  }

  if (input.category !== undefined) {
    updateData.category = input.category;
  }

  if (input.date !== undefined) {
    updateData.date = input.date;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  const prismaRecord = await prisma.financialRecord.update({
    where: { id: input.recordId },
    data: updateData,
  });

  return toDomainRecord(prismaRecord);
}

export async function deleteRecord(recordId: string): Promise<void> {
  const existing = await prisma.financialRecord.findUnique({
    where: { id: recordId },
  });

  if (!existing || existing.deletedAt !== null) {
    throw new NotFoundError('Record not found');
  }

  await prisma.financialRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });
}
