export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

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
    // Levels ordered from most verbose (debug) to least verbose (error)
    // If level is 'info', we log 'info', 'warn', 'error' (index >= 2)
    const levels: Exclude<LogLevel, 'none'>[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level as Exclude<LogLevel, 'none'>);
    const messageLevelIndex = levels.indexOf(messageLevel);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `${this.prefix} [${level.toUpperCase()}] ${message}`;
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
