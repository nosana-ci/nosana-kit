import { jest } from '@jest/globals';
import { Logger } from '../Logger';

describe('Logger', () => {
  beforeEach(() => {
    (Logger as any).instance = undefined;
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a singleton instance', () => {
    const logger1 = Logger.getInstance();
    const logger2 = Logger.getInstance();
    expect(logger1).toBe(logger2);
  });

  it('should log messages with correct level', () => {
    const logger = Logger.getInstance({ level: 'debug' });
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).toHaveBeenCalledWith('[Nosana] [DEBUG] debug message');
    expect(console.info).toHaveBeenCalledWith('[Nosana] [INFO] info message');
    expect(console.warn).toHaveBeenCalledWith('[Nosana] [WARN] warn message');
    expect(console.error).toHaveBeenCalledWith('[Nosana] [ERROR] error message');
  });

  it('should respect custom prefix', () => {
    const logger = Logger.getInstance({ prefix: 'TEST' });
    logger.info('test message');
    expect(console.info).toHaveBeenCalledWith('TEST [INFO] test message');
  });

  it('should not log when disabled', () => {
    const logger = Logger.getInstance({ enabled: false });
    logger.info('test message');
    expect(console.info).not.toHaveBeenCalled();
  });

  it('should update log level', () => {
    const logger = Logger.getInstance();
    logger.setLevel('warn');
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[Nosana] [WARN] warn message');
    expect(console.error).toHaveBeenCalledWith('[Nosana] [ERROR] error message');
  });
}); 