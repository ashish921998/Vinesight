export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

function parseLevel(input?: string): LogLevel {
  const v = (input || '').toLowerCase()
  if (v === 'debug') return LogLevel.DEBUG
  if (v === 'info') return LogLevel.INFO
  if (v === 'warn' || v === 'warning') return LogLevel.WARN
  if (v === 'error') return LogLevel.ERROR
  return LogLevel.INFO
}

type Meta = Record<string, unknown>

export class Logger {
  private level: LogLevel
  private json: boolean
  private base: Meta

  constructor(opts?: { level?: LogLevel; json?: boolean; base?: Meta }) {
    const envLevel = parseLevel(process.env.LOG_LEVEL)
    this.level = opts?.level ?? (process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : envLevel)
    this.json = opts?.json ?? (process.env.NODE_ENV === 'production')
    this.base = opts?.base ?? {}
  }

  child(meta: Meta) {
    return new Logger({ level: this.level, json: this.json, base: { ...this.base, ...meta } })
  }

  private shouldLog(level: LogLevel) {
    return level <= this.level
  }

  private out(levelName: string, message: string, extra: Meta) {
    const ts = new Date().toISOString()
    if (this.json) {
      const entry = { level: levelName, msg: message, ts, ...this.base, ...extra }
      console.log(JSON.stringify(entry))
    } else {
      const ctx = Object.keys({ ...this.base, ...extra }).length ? { ...this.base, ...extra } : undefined
      if (levelName === 'error') console.error(`[ERROR] ${ts} ${message}`, ctx ?? '')
      else if (levelName === 'warn') console.warn(`[WARN] ${ts} ${message}`, ctx ?? '')
      else console.log(`[${levelName.toUpperCase()}] ${ts} ${message}`, ctx ?? '')
    }
  }

  error(message: string, meta: Meta = {}) {
    if (this.shouldLog(LogLevel.ERROR)) this.out('error', message, meta)
  }
  warn(message: string, meta: Meta = {}) {
    if (this.shouldLog(LogLevel.WARN)) this.out('warn', message, meta)
  }
  info(message: string, meta: Meta = {}) {
    if (this.shouldLog(LogLevel.INFO)) this.out('info', message, meta)
  }
  debug(message: string, meta: Meta = {}) {
    if (this.shouldLog(LogLevel.DEBUG)) this.out('debug', message, meta)
  }
}

export const logger = new Logger()
export const createLogger = (requestId?: string) =>
  requestId ? new Logger({ base: { requestId } }) : new Logger()
