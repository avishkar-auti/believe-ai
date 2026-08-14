/**
 * Shared pagination envelope for list endpoints.
 */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;
