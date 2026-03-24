import { withPagination } from '../withPagination.js';

const TEST_CURSOR_NEXT = 'next-cursor';
const TEST_CURSOR_PREV = 'prev-cursor';

describe('withPagination', () => {
  it('should return data with null nextPage/previousPage when no cursors', () => {
    const data = {
      items: [{ id: 1 }],
      pagination: {
        cursor_next: null,
        cursor_prev: null,
        total_items: 1,
      },
    };

    const result = withPagination(data, vi.fn());

    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.total_items).toBe(1);
    expect(result.nextPage).toBeNull();
    expect(result.previousPage).toBeNull();
  });

  it('should return callable nextPage when cursor_next is present', async () => {
    const data = {
      items: [{ id: 1 }],
      pagination: {
        cursor_next: TEST_CURSOR_NEXT,
        cursor_prev: null,
        total_items: 2,
      },
    };

    const nextPageData = {
      items: [{ id: 2 }],
      total_items: 2,
      nextPage: null,
      previousPage: null,
    };
    const fetchFn = vi.fn().mockResolvedValue(nextPageData);

    const result = withPagination(data, fetchFn);

    expect(result.nextPage).not.toBeNull();
    expect(result.previousPage).toBeNull();

    const next = await result.nextPage!();
    expect(fetchFn).toHaveBeenCalledWith(TEST_CURSOR_NEXT);
    expect(next).toEqual(nextPageData);
  });

  it('should return callable previousPage when cursor_prev is present', async () => {
    const data = {
      items: [{ id: 2 }],
      pagination: {
        cursor_next: null,
        cursor_prev: TEST_CURSOR_PREV,
        total_items: 2,
      },
    };

    const prevPageData = {
      items: [{ id: 1 }],
      total_items: 2,
      nextPage: null,
      previousPage: null,
    };
    const fetchFn = vi.fn().mockResolvedValue(prevPageData);

    const result = withPagination(data, fetchFn);

    expect(result.nextPage).toBeNull();
    expect(result.previousPage).not.toBeNull();

    const prev = await result.previousPage!();
    expect(fetchFn).toHaveBeenCalledWith(TEST_CURSOR_PREV);
    expect(prev).toEqual(prevPageData);
  });
});
