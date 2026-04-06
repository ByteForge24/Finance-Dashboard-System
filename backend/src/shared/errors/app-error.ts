export class AppError extends Error {
  constructor(public statusCode: number, public errorType: string, message: string) {
    super(message);
    this.name = errorType;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details: Array<{ field: string; issue: string }> = []) {
    super(400, 'ValidationError', message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NotFoundError', message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UnauthorizedError', message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'ForbiddenError', message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'ConflictError', message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
