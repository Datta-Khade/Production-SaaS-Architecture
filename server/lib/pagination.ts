/**
 * Pagination Utilities — Hard gate against unbounded queries
 * 
 * normalizePagination() enforces max page size at the utility level.
 * No feature can accidentally OOM the server with an unbounded list.
 */

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;

interface RawPaginationInput {
  page?: string | number;
  limit?: string | number;
}

interface NormalizedPagination {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Normalize and validate pagination parameters from query string.
 * Returns safe defaults if inputs are missing or invalid.
 */
export const normalizePagination = (query: RawPaginationInput): NormalizedPagination => {
  let page = Number(query.page);
  let limit = Number(query.limit);

  // Default and clamp page
  if (!Number.isFinite(page) || page < 1) {
    page = DEFAULT_PAGE;
  }
  page = Math.floor(page);

  // Default and clamp limit
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_PAGE_SIZE;
  }
  limit = Math.min(Math.floor(limit), MAX_PAGE_SIZE);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

/**
 * Build pagination metadata for response
 */
export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
