import { createSubmissionClient } from '@defra/lis-hubs-infra-core'

const service = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
}))

vi.mock('@defra/lis-hubs-infra-core', () => ({
  createSubmissionClient: vi.fn(() => service)
}))

const NOT_FOUND = 404
const UNAVAILABLE = 503

/**
 * @param {number} statusCode
 * @returns {Error & { statusCode: number }} as the service client throws
 *   for a call the BE4FE answers with an error status
 */
function failure(statusCode) {
  return Object.assign(new Error(`Request failed - ${statusCode}`), {
    statusCode
  })
}

describe('CattleDeathBe4FeClient', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  test('it sends the configured BE4FE API key', async () => {
    // Arrange
    vi.stubEnv('CATTLE_DEATH_API_KEY', 'test-api-key')
    vi.resetModules()

    // Act
    vi.mocked(createSubmissionClient).mockReturnValue(service)
    await import('./client.js')

    // Assert
    expect(vi.mocked(createSubmissionClient)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        serviceName: 'lis-be4fe-cattle-death',
        port: 8086
      })
    )
  })

  test.each([
    ['default', undefined, 5000],
    ['environment override', '12000', 12000]
  ])(
    'it passes the %s timeout to the service client',
    async (_, value, expected) => {
      // Arrange
      vi.stubEnv('CATTLE_DEATH_API_TIMEOUT', value)
      vi.resetModules()

      // Act
      vi.mocked(createSubmissionClient).mockReturnValue(service)
      await import('./client.js')

      // Assert
      expect(vi.mocked(createSubmissionClient)).toHaveBeenLastCalledWith(
        expect.objectContaining({ timeout: expected })
      )
    }
  )

  test.each([
    ['default', undefined, undefined, 5, 30000],
    ['environment override', '3', '1000', 3, 1000]
  ])(
    'it passes the %s circuit breaker to the service client',
    async (_, threshold, reset, expectedThreshold, expectedReset) => {
      // Arrange
      vi.stubEnv(
        'CATTLE_DEATH_API_CIRCUIT_BREAKER_FAILURE_THRESHOLD',
        threshold
      )
      vi.stubEnv('CATTLE_DEATH_API_CIRCUIT_BREAKER_RESET_TIMEOUT', reset)
      vi.resetModules()

      // Act
      vi.mocked(createSubmissionClient).mockReturnValue(service)
      await import('./client.js')

      // Assert
      expect(vi.mocked(createSubmissionClient)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          circuitBreaker: {
            failureThreshold: expectedThreshold,
            resetTimeout: expectedReset
          }
        })
      )
    }
  )

  describe('be4fe.get()', () => {
    test('it gives the BE4FE answer', async () => {
      // Arrange
      vi.resetModules()
      const { be4fe } = await import('./client.js')
      const answer = { payload: { cph: '10/081/1234', animals: [] } }
      service.get.mockResolvedValueOnce(answer)

      // Act
      const result = await be4fe.get('data/10/081/1234/animals')

      // Assert
      expect(service.get).toHaveBeenCalledWith('data/10/081/1234/animals')
      expect(result).toBe(answer)
    })

    test('it answers not found for a page the BE4FE does not hold', async () => {
      // Arrange
      vi.resetModules()
      const { be4fe } = await import('./client.js')
      service.get.mockRejectedValueOnce(failure(NOT_FOUND))

      // Act
      let thrown
      try {
        await be4fe.get('data/10/081/9999/animals')
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown.output.statusCode).toBe(NOT_FOUND)
    })

    test('it passes on any other failure', async () => {
      // Arrange
      vi.resetModules()
      const { be4fe } = await import('./client.js')
      const unavailable = failure(UNAVAILABLE)
      service.get.mockRejectedValueOnce(unavailable)

      // Act
      let thrown
      try {
        await be4fe.get('data/10/081/1234/animals')
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(unavailable)
    })
  })

  describe('holdingDataPath() and earTagsPath()', () => {
    test('they give the holding paths, each part of the CPH encoded', async () => {
      // Arrange
      vi.resetModules()
      const { earTagsPath, holdingDataPath } = await import('./client.js')

      // Act
      const data = holdingDataPath('10/081/12 4')
      const earTags = earTagsPath('10/081/1234')

      // Assert
      expect(data).toBe('data/10/081/12%204')
      expect(earTags).toBe('data/10/081/1234/ear-tags')
    })
  })
})
