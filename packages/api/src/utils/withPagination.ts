import type {
  PaginatedResult,
  PaginationMeta,
} from '../routes/deployments/types.js';

/**
 * Wraps API response data with pagination helpers.
 *
 * @param data - The API response containing pagination metadata
 * @param fetchFn - Function that fetches the next/previous page given a cursor
 * @returns A PaginatedResult with navigation methods and total items
 *
 * @example
 * ```ts
 * return withPagination(
 *   data,
 *   (cursor) => deploymentGetEvents(client, state, { ...params, cursor })
 * );
 * ```
 */
export function withPagination<TData extends Record<string, unknown>>(
  data: TData & { pagination: PaginationMeta },
  fetchFn: (
    cursor: string,
  ) => Promise<PaginatedResult<Omit<TData, 'pagination'>>>,
): PaginatedResult<Omit<TData, 'pagination'>> {
  const { pagination, ...rest } = data;

  const nextPage = pagination.cursor_next
    ? async () => fetchFn(pagination.cursor_next!)
    : null;

  const previousPage = pagination.cursor_prev
    ? async () => fetchFn(pagination.cursor_prev!)
    : null;

  return {
    ...rest,
    total_items: pagination.total_items,
    nextPage,
    previousPage,
  } as PaginatedResult<Omit<TData, 'pagination'>>;
}
