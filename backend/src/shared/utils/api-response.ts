import { Response } from 'express';

export interface ListResponse<T> {
  data: T[];
  count?: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json(data);
}

export function sendList<T>(res: Response, items: T[], statusCode = 200, count?: number): Response {
  const response: ListResponse<T> = { data: items };
  if (count !== undefined) {
    response.count = count;
  }
  return res.status(statusCode).json(response);
}

export function sendAggregation<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json(data);
}

export function sendEmpty(res: Response): Response {
  return res.status(204).send();
}
