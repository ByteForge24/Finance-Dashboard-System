import { Request, Response, NextFunction } from 'express';
import {
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendInternalError,
  sendError,
} from '../errors/api-error-response.js';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../errors/index.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    sendValidationError(res, err.message, err.details);
    return;
  }

  if (err instanceof UnauthorizedError) {
    sendUnauthorized(res, err.message);
    return;
  }

  if (err instanceof ForbiddenError) {
    sendForbidden(res, err.message);
    return;
  }

  if (err instanceof NotFoundError) {
    sendNotFound(res, err.message);
    return;
  }

  if (err instanceof ConflictError) {
    sendConflict(res, err.message);
    return;
  }

  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    if (statusCode >= 500) {
      console.error('Server error:', err);
      message = 'Internal server error';
    }
    sendError(res, err.errorType, message, statusCode);
    return;
  }

  console.error('Unhandled error:', err);
  sendInternalError(res);
}
