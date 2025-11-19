import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../../../src/logger/Logger.js';

describe('Logger', () => {
  beforeEach(() => {
    // reset singleton
    (Logger as unknown as { instance?: unknown }).instance = undefined;
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates a singleton instance', () => {
    const a = Logger.getInstance();
    const b = Logger.getInstance();
    expect(a).toBe(b);
  });

  it('respects initial options and logs accordingly', () => {
    const logger = Logger.getInstance({ level: 'debug', prefix: 'TEST', enabled: true });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(console.debug).toHaveBeenCalledWith('TEST [DEBUG] d');
    expect(console.info).toHaveBeenCalledWith('TEST [INFO] i');
    expect(console.warn).toHaveBeenCalledWith('TEST [WARN] w');
    expect(console.error).toHaveBeenCalledWith('TEST [ERROR] e');
  });

  it('does not log when disabled', () => {
    const logger = Logger.getInstance({ enabled: false });
    logger.info('x');
    logger.error('y');
    expect(console.info).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('filters by level and supports setLevel', () => {
    const logger = Logger.getInstance({ level: 'warn' });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[Nosana] [WARN] w');
    expect(console.error).toHaveBeenCalledWith('[Nosana] [ERROR] e');

    vi.clearAllMocks();
    logger.setLevel('debug');
    logger.debug('d2');
    expect(console.debug).toHaveBeenCalledWith('[Nosana] [DEBUG] d2');
  });

  it('supports setPrefix and enable/disable at runtime', () => {
    const logger = Logger.getInstance();
    logger.setPrefix('NEW');
    logger.disable();
    logger.info('i');
    expect(console.info).not.toHaveBeenCalled();

    logger.enable();
    logger.info('i2');
    expect(console.info).toHaveBeenCalledWith('NEW [INFO] i2');
  });
});
