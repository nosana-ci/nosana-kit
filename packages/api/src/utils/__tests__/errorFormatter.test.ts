import { errorFormatter } from '../errorFormatter.js';

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
});
