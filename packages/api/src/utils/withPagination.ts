import type { PaginatedResult, PaginationMeta } from '../routes/deployments/types.js';

export { PaginatedResult } from '../routes/deployments/types.js';

/**
 * Generic pagination wrapper.
 *
 * Takes a response that contains `{ pagination: PaginationMeta }` and the rest
 * of `T`, and returns the `T` data with `total_items`, `nextPage`, and
 * `previousPage` helpers.
 */
export function withPagination<T extends Record<string, unknown>>(
  data: T & { pagination: PaginationMeta },
  fetchPage: (cursor: string) => Promise<PaginatedResult<Omit<T, 'pagination'>>>,
): PaginatedResult<Omit<T, 'pagination'>> {
  const { pagination, ...rest } = data;

  return {
    ...rest,
    total_items: pagination.total_items,
    nextPage: pagination.cursor_next
      ? () => fetchPage(pagination.cursor_next!)
      : null,
    previousPage: pagination.cursor_prev
      ? () => fetchPage(pagination.cursor_prev!)
      : null,
  } as PaginatedResult<Omit<T, 'pagination'>>;
}
