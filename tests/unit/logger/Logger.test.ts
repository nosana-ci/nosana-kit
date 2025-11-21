import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../../../src/logger/Logger.js';

describe('Logger', () => {
  let consoleDebug: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // reset singleton
    (Logger as unknown as { instance?: unknown }).instance = undefined;
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {}) as any;
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {}) as any;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {}) as any;
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}) as any;
  });

  it('creates a singleton instance', () => {
    const a = Logger.getInstance();
    const b = Logger.getInstance();
    expect(a).toBe(b);
  });

  it('logs all levels when level is debug', () => {
    const debugMessage = 'debug message';
    const infoMessage = 'info message';
    const warnMessage = 'warn message';
    const errorMessage = 'error message';

    const logger = Logger.getInstance({ level: 'debug', enabled: true });
    logger.debug(debugMessage);
    logger.info(infoMessage);
    logger.warn(warnMessage);
    logger.error(errorMessage);

    expect(consoleDebug).toHaveBeenCalledWith(expect.stringContaining(debugMessage));
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining(infoMessage));
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining(warnMessage));
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });

  it('does not log when disabled', () => {
    const infoMessage = 'info message';
    const errorMessage = 'error message';

    const logger = Logger.getInstance({ enabled: false });
    logger.info(infoMessage);
    logger.error(errorMessage);

    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('filters logs below configured level', () => {
    const warnMessage = 'warn message';
    const errorMessage = 'error message';

    const logger = Logger.getInstance({ level: 'warn' });
    logger.debug('debug message');
    logger.info('info message');
    logger.warn(warnMessage);
    logger.error(errorMessage);

    expect(consoleDebug).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining(warnMessage));
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });

  it('allows changing log level at runtime', () => {
    const debugMessage = 'debug message';

    const logger = Logger.getInstance({ level: 'warn' });
    logger.debug(debugMessage);
    expect(consoleDebug).not.toHaveBeenCalled();

    logger.setLevel('debug');
    logger.debug(debugMessage);
    expect(consoleDebug).toHaveBeenCalledWith(expect.stringContaining(debugMessage));
  });

  it('allows enabling and disabling at runtime', () => {
    const infoMessage = 'info message';

    const logger = Logger.getInstance();
    logger.disable();
    logger.info(infoMessage);
    expect(consoleInfo).not.toHaveBeenCalled();

    logger.enable();
    logger.info(infoMessage);
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining(infoMessage));
  });

  it('includes custom prefix in log messages', () => {
    const customPrefix = 'TEST';
    const infoMessage = 'info message';

    const logger = Logger.getInstance({ prefix: customPrefix });
    logger.info(infoMessage);

    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining(customPrefix));
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining(infoMessage));
  });
});
