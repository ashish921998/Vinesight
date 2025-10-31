// Logger utility for development and production environments
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO

  constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'development') {
      this.level = LogLevel.DEBUG
    } else if (process.env.NODE_ENV === 'production') {
      this.level = LogLevel.ERROR
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }
}

export const logger = new Logger()
