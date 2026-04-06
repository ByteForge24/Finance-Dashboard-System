import { Router, Request, Response } from 'express';
import { sendSuccess, sendEmpty, sendAggregation, asyncHandler } from '../../shared/utils/index.js';
import {
  sendValidationError,
  ErrorDetail,
} from '../../shared/errors/api-error-response.js';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/index.js';
import { AllRecordTypes, isValidRecordType } from '../../shared/domain/record-type.js';
import type { FinancialRecord } from '../../shared/domain/financial-record.js';
import type { UpdateFinancialRecordInput } from '../../shared/domain/index.js';
import {
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission,
  getAuthenticatedUser,
} from '../../shared/middleware/index.js';
import { PermissionAction } from '../../shared/access-control/permission-action.js';
import * as recordsService from './records.service.js';
import { CreateRecordInput, ListRecordsFilters, RecordServiceUpdateInput, SuggestCategoryInput } from './records.types.js';
import {
  validate,
  createRecordSchema,
  suggestCategorySchema,
} from '../../shared/validation/index.js';

function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

const router = Router();

router.post(
  '/',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.create),
  asyncHandler(async (req: Request, res: Response) => {
    const body: CreateRecordInput = req.body;
    const user = getAuthenticatedUser(req);

    if (!user) {
      throw new UnauthorizedError('Authentication context not available');
    }

    const result = validate(body, createRecordSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    let parsedDate: Date;
    if (result.data!.date instanceof Date) {
      parsedDate = result.data!.date;
    } else {
      const parsed = parseDate(result.data!.date as string);
      if (!parsed) {
        return sendValidationError(res, 'Request validation failed', [
          { field: 'date', issue: 'must be a valid date' },
        ]);
      }
      parsedDate = parsed;
    }

    const record = await recordsService.createRecord({
      amount: result.data!.amount as number,
      type: result.data!.type as string,
      category: result.data!.category as string,
      date: parsedDate,
      notes: (result.data!.notes as string | null) ?? null,
      createdById: user.id,
    });

    return sendSuccess(res, record, 201);
  })
);

router.get(
  '/',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.list),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    let page = 1;
    let limit = 20;

    if (query.page) {
      const pageNum = parseInt(query.page as string, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        page = pageNum;
      }
    }

    if (query.limit) {
      const limitNum = parseInt(query.limit as string, 10);
      if (!isNaN(limitNum) && limitNum >= 1 && limitNum <= 100) {
        limit = limitNum;
      }
    }

    const validationErrors: ErrorDetail[] = [];

    if (query.type) {
      if (!isValidRecordType(query.type as string)) {
        validationErrors.push({ field: 'type', issue: `must be one of: ${AllRecordTypes.join(', ')}` });
      }
    }

    if (query.startDate) {
      const parsed = parseDate(query.startDate as string);
      if (!parsed) {
        validationErrors.push({ field: 'startDate', issue: 'must be a valid date string' });
      }
    }

    if (query.endDate) {
      const parsed = parseDate(query.endDate as string);
      if (!parsed) {
        validationErrors.push({ field: 'endDate', issue: 'must be a valid date string' });
      }
    }

    if (query.sortBy) {
      if (query.sortBy !== 'date' && query.sortBy !== 'createdAt') {
        validationErrors.push({ field: 'sortBy', issue: 'must be one of: date, createdAt' });
      }
    }

    if (query.sortOrder) {
      if (query.sortOrder !== 'asc' && query.sortOrder !== 'desc') {
        validationErrors.push({ field: 'sortOrder', issue: 'must be one of: asc, desc' });
      }
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (query.startDate) {
      const parsed = parseDate(query.startDate as string);
      if (parsed) {
        parsedStartDate = parsed;
      }
    }

    if (query.endDate) {
      const parsed = parseDate(query.endDate as string);
      if (parsed) {
        parsedEndDate = parsed;
      }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      validationErrors.push({ field: 'startDate', issue: 'must not be after endDate' });
    }

    if (validationErrors.length > 0) {
      return sendValidationError(res, 'Request validation failed', validationErrors);
    }

    const filters: ListRecordsFilters = {};

    if (query.type) {
      filters.type = query.type as string;
    }

    if (query.category) {
      filters.category = query.category as string;
    }

    if (parsedStartDate) {
      filters.startDate = parsedStartDate;
    }

    if (parsedEndDate) {
      filters.endDate = parsedEndDate;
    }

    if (query.search) {
      filters.search = query.search as string;
    }

    const sortBy = (query.sortBy === 'createdAt' ? 'createdAt' : 'date') as 'date' | 'createdAt';
    const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const result = await recordsService.listRecords({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return sendAggregation(res, {
      data: result.records,
      pagination: result.pagination,
    }, 200);
  })
);

router.get(
  '/:id',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.read),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new NotFoundError('Record not found');
    }

    const record = await recordsService.getRecordById(id.trim());
    return sendSuccess(res, record, 200);
  })
);

router.patch(
  '/:id',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.update),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as Partial<UpdateFinancialRecordInput>;

    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new NotFoundError('Record not found');
    }

    const validationErrors: ErrorDetail[] = [];

    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      validationErrors.push({ field: 'amount', issue: 'must be a positive number' });
    }

    if (body.type !== undefined && (typeof body.type !== 'string' || !isValidRecordType(body.type))) {
      validationErrors.push({ field: 'type', issue: `must be one of: ${AllRecordTypes.join(', ')}` });
    }

    if (body.category !== undefined && (typeof body.category !== 'string' || !body.category.trim())) {
      validationErrors.push({ field: 'category', issue: 'must be a non-empty string' });
    }

    if (body.date !== undefined) {
      if (!(body.date instanceof Date) && typeof body.date !== 'string') {
        validationErrors.push({ field: 'date', issue: 'must be a valid date' });
      } else if (typeof body.date === 'string') {
        const parsed = parseDate(body.date);
        if (!parsed) {
          validationErrors.push({ field: 'date', issue: 'must be a valid date string' });
        }
      }
    }

    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
      validationErrors.push({ field: 'notes', issue: 'must be a string or null' });
    }

    if (validationErrors.length > 0) {
      return sendValidationError(res, 'Request validation failed', validationErrors);
    }

    const updateInput: RecordServiceUpdateInput = {
      recordId: id.trim(),
    };

    if (body.amount !== undefined) {
      updateInput.amount = body.amount;
    }

    if (body.type !== undefined) {
      updateInput.type = body.type;
    }

    if (body.category !== undefined) {
      updateInput.category = body.category!.trim();
    }

    if (body.date !== undefined) {
      updateInput.date = body.date instanceof Date ? body.date : parseDate(body.date as unknown as string)!;
    }

    if (body.notes !== undefined) {
      updateInput.notes = body.notes;
    }

    const hasUpdate = body.amount !== undefined || body.type !== undefined || body.category !== undefined || body.date !== undefined || body.notes !== undefined;
    if (!hasUpdate) {
      return sendValidationError(res, 'Request validation failed', [
        { field: 'body', issue: 'must include at least one field to update' },
      ]);
    }

    const record = await recordsService.updateRecord(updateInput);
    return sendSuccess(res, record, 200);
  })
);

router.delete(
  '/:id',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.delete),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new NotFoundError('Record not found');
    }

    await recordsService.deleteRecord(id.trim());
    return sendEmpty(res);
  })
);

router.post(
  '/suggest-category',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.records.suggestCategory),
  asyncHandler(async (req: Request, res: Response) => {
    const body: SuggestCategoryInput = req.body;

    // Validate request body
    const result = validate(body, suggestCategorySchema);
    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    // Get the category suggester from app context
    const app = res.req.app;
    const categorySuggester = app.locals.categorySuggester;

    if (!categorySuggester) {
      // Fallback should never happen, but handle gracefully
      return sendValidationError(res, 'Category suggester not initialized', [
        { field: 'server', issue: 'Internal error: suggester not available' },
      ]);
    }

    // Call the suggester
    const suggestion = await categorySuggester.suggest(
      result.data!.notes as string,
      result.data!.type as 'income' | 'expense' | undefined,
      result.data!.amount as number | undefined
    );

    return sendSuccess(res, suggestion, 200);
  })
);

export default router;
