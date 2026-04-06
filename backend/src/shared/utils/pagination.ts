export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export function parsePaginationParams(page?: unknown, limit?: unknown): PaginationParams {
  let parsedPage = DEFAULT_PAGE;
  let parsedLimit = DEFAULT_LIMIT;

  if (typeof page === 'string') {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      parsedPage = pageNum;
    }
  } else if (typeof page === 'number' && page > 0) {
    parsedPage = page;
  }

  if (typeof limit === 'string') {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum >= MIN_LIMIT && limitNum <= MAX_LIMIT) {
      parsedLimit = limitNum;
    }
  } else if (typeof limit === 'number' && limit >= MIN_LIMIT && limit <= MAX_LIMIT) {
    parsedLimit = limit;
  }

  const offset = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, offset };
}

export function calculatePaginationMetadata(
  page: number,
  limit: number,
  total: number
): PaginationMetadata {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
