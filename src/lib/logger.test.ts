import { logger } from '@/lib/logger'

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    jest.restoreAllMocks()
    process.env.NODE_ENV = originalEnv
    jest.resetModules()
  })

  it('logs info and error in test env, but not debug', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    logger.debug('should not log')
    logger.info('hello %s', 'world')
    logger.warn('careful')
    logger.error('boom')

    expect(logSpy).toHaveBeenCalledWith('[INFO] hello %s', 'world')
    expect(warnSpy).toHaveBeenCalledWith('[WARN] careful')
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] boom')
  })

  it('only logs errors in production', () => {
    process.env.NODE_ENV = 'production'
    jest.isolateModules(() => {
      // Re-import to pick up production env
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logger: prodLogger } = require('@/lib/logger') as typeof import('./logger')
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      prodLogger.debug('nope')
      prodLogger.info('nope')
      prodLogger.warn('nope')
      prodLogger.error('yes')

      expect(logSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith('[ERROR] yes')
    })
  })
})
