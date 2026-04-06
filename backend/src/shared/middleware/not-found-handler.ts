import { Request, Response } from 'express';
import { sendNotFound } from '../errors/api-error-response.js';

export function notFoundHandler(req: Request, res: Response): void {
  sendNotFound(res, `Route ${req.method} ${req.path} not found`);
}
