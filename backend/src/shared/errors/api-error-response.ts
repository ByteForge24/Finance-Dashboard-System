import { Response } from 'express';

export interface ErrorDetail {
  field: string;
  issue: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  details: ErrorDetail[];
}

type AnyErrorResponse = ErrorResponse | ValidationErrorResponse;

function createErrorPayload(
  errorType: string,
  message: string,
  details?: ErrorDetail[]
): AnyErrorResponse {
  if (details) {
    const payload: ValidationErrorResponse = {
      error: errorType,
      message,
      details,
    };
    return payload;
  }
  const payload: ErrorResponse = {
    error: errorType,
    message,
  };
  return payload;
}

export function sendError(
  res: Response,
  errorType: string,
  message: string,
  statusCode = 400
): Response {
  const payload = createErrorPayload(errorType, message);
  return res.status(statusCode).json(payload);
}

export function sendValidationError(
  res: Response,
  message: string,
  details: ErrorDetail[]
): Response {
  const payload = createErrorPayload('ValidationError', message, details);
  return res.status(400).json(payload);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): Response {
  return sendError(res, 'UnauthorizedError', message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): Response {
  return sendError(res, 'ForbiddenError', message, 403);
}

export function sendNotFound(res: Response, message = 'Not found'): Response {
  return sendError(res, 'NotFoundError', message, 404);
}

export function sendConflict(res: Response, message = 'Conflict'): Response {
  return sendError(res, 'ConflictError', message, 409);
}

export function sendInternalError(res: Response, message = 'Internal server error'): Response {
  return sendError(res, 'InternalServerError', message, 500);
}
