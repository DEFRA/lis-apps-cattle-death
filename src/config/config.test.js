import { afterEach, describe, expect, test, vi } from 'vitest'

describe('configuration environment defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test('uses production-safe defaults in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.LOG_FORMAT
    delete process.env.ENABLE_SECURE_CONTEXT
    delete process.env.SESSION_CACHE_ENGINE
    vi.resetModules()

    const { config } = await import('./config.js')

    expect(config.get('log.format')).toBe('ecs')
    expect(config.get('isSecureContextEnabled')).toBe(true)
    expect(config.get('session.cache.engine')).toBe('redis')
  })
})

describe('session cache ttl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test('accepts an ISO 8601 duration from the environment', async () => {
    // Arrange
    vi.stubEnv('SESSION_CACHE_TTL', 'PT4H')

    // Act
    const { config } = await import('./config.js?ttl=iso')

    // Assert
    expect(config.get('session.cache.ttl')).toBe(14400000)
  })

  test('rejects a ttl over 7 days', async () => {
    // Arrange
    vi.stubEnv('SESSION_CACHE_TTL', 'P8D')

    // Act
    let error
    try {
      await import('./config.js?ttl=over')
    } catch (e) {
      error = e
    }

    // Assert
    expect(error.message).toContain(
      'session.cache.ttl: must be no more than P7D'
    )
  })
})
