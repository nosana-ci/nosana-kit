export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  enabled?: boolean;
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = 'info';
  private prefix: string = '[Nosana]';
  private enabled: boolean = true;

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

  private shouldLog(messageLevel: LogLevel): boolean {
    if (!this.enabled) return false;
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(this.level);
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
