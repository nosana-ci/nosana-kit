import { errorFormatter, isNosanaApiError } from '../errorFormatter.js';

describe('errorFormatter', () => {
  test('when called with only a message, it should return an error with that message', () => {
    const err = errorFormatter('Something failed');

    expect(err.message).toBe('Something failed');
  });

  test('when error object has error field, it should include it in the message', () => {
    const err = errorFormatter('Request failed', { error: 'Bad request' });

    expect(err.message).toBe('Request failed: Bad request');
  });

  test('when error object has message field, it should include it in the message', () => {
    const err = errorFormatter('Request failed', { message: 'Not found' });

    expect(err.message).toBe('Request failed: Not found');
  });

  it('should preserve code and statusCode from error object', () => {
    const err = errorFormatter('Failed', { error: 'Bad', code: 'ERR_001', statusCode: 400 });

    expect(err.code).toBe('ERR_001');
    expect(err.statusCode).toBe(400);
  });

  test('when error is a string, it should append it to the message', () => {
    const err = errorFormatter('Failed', 'string error');

    expect(err.message).toBe('Failed: string error');
  });

  test('when error object has unknown structure, it should return unknown error with details', () => {
    const err = errorFormatter('Failed', { foo: 'bar' });

    expect(err.message).toBe('Failed: Unknown error');
    expect(err.details).toEqual({ foo: 'bar' });
  });

  test('when error is neither string nor object, it should return message with details', () => {
    const err = errorFormatter('Failed', 123);

    expect(err.message).toBe('Failed');
    expect(err.details).toBe(123);
  });

  describe('with a response', () => {
    it('takes statusCode from response.status when the body has none', () => {
      const response = new Response(null, { status: 409 });
      const err = errorFormatter('Failed', { code: 'IDEMPOTENCY_KEY_IN_PROGRESS' }, response);

      expect(err.code).toBe('IDEMPOTENCY_KEY_IN_PROGRESS');
      expect(err.statusCode).toBe(409);
    });

    it('prefers a body statusCode over response.status', () => {
      const response = new Response(null, { status: 500 });
      const err = errorFormatter('Failed', { error: 'Bad', statusCode: 400 }, response);

      expect(err.statusCode).toBe(400);
    });

    it('parses the Retry-After header into seconds (number)', () => {
      const response = new Response(null, { status: 409, headers: { 'Retry-After': '5' } });
      const err = errorFormatter('Failed', { code: 'IDEMPOTENCY_KEY_IN_PROGRESS' }, response);

      expect(err.retryAfter).toBe(5);
    });

    it('still records the status for a body-less proxy error', () => {
      const response = new Response(null, { status: 502 });
      const err = errorFormatter('Failed', undefined, response);

      expect(err.message).toBe('Failed');
      expect(err.statusCode).toBe(502);
    });

    it('leaves retryAfter undefined when the header is absent or unparseable', () => {
      const noHeader = errorFormatter('Failed', { message: 'nope' }, new Response(null, { status: 409 }));
      expect(noHeader.retryAfter).toBeUndefined();

      const garbage = new Response(null, { status: 409, headers: { 'Retry-After': 'soon' } });
      expect(errorFormatter('Failed', {}, garbage).retryAfter).toBeUndefined();
    });
  });
});

describe('isNosanaApiError', () => {
  it('returns true for an error carrying a numeric statusCode', () => {
    const err = errorFormatter('Failed', { code: 'X' }, new Response(null, { status: 409 }));

    expect(isNosanaApiError(err)).toBe(true);
    // narrows without casting
    if (isNosanaApiError(err)) {
      expect(err.statusCode).toBe(409);
    }
  });

  it('returns false for a network-style error with no status', () => {
    expect(isNosanaApiError(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isNosanaApiError(undefined)).toBe(false);
    expect(isNosanaApiError({ statusCode: 409 })).toBe(false);
  });
});
