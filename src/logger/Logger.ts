export type LogLevel = 'none' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  enabled?: boolean;
}

export class Logger {
  private static instance: Logger;
  public level: LogLevel = 'info';
  public prefix: string = '[Nosana]';
  public enabled: boolean = true;

  private constructor(options?: LoggerOptions) {
    if (options) {
      this.level = options.level || this.level;
      this.prefix = options.prefix || this.prefix;
      this.enabled = options.enabled ?? this.enabled;
    }
  }

  public static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  private shouldLog(messageLevel: Exclude<LogLevel, 'none'>): boolean {
    if (!this.enabled || this.level === 'none') return false;
    // Levels ordered from most verbose (trace) to least verbose (fatal)
    const levels: Exclude<LogLevel, 'none'>[] = [
      'trace',
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ];
    const currentLevelIndex = levels.indexOf(this.level as Exclude<LogLevel, 'none'>);
    const messageLevelIndex = levels.indexOf(messageLevel);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `${this.prefix} [${level.toUpperCase()}] ${message}`;
  }

  public trace(message: string): void {
    if (this.shouldLog('trace')) {
      console.trace(this.formatMessage('trace', message));
    }
  }

  public debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message));
    }
  }

  public info(message: string): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message));
    }
  }

  public warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message));
    }
  }

  public error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message));
    }
  }

  public fatal(message: string): void {
    if (this.shouldLog('fatal')) {
      console.error(this.formatMessage('fatal', message));
    }
  }

  public child(bindings: Record<string, any>): Logger {
    // Create a new logger instance with modified prefix
    const childLogger = new Logger({
      level: this.level,
      prefix: this.prefix,
      enabled: this.enabled,
    });

    // Add bindings to the prefix if provided
    if (Object.keys(bindings).length > 0) {
      const bindingString = Object.entries(bindings)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      childLogger.prefix = `${this.prefix} [${bindingString}]`;
    }

    return childLogger;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }
}
