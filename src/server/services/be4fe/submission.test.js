import { submissions } from '#server/services/be4fe/client.js'
import * as client from './submission.js'

vi.mock('#server/services/be4fe/client.js')

const NOT_FOUND = 404
const UNAVAILABLE = 503

/**
 * @param {number} statusCode
 * @returns {Error & { statusCode: number }} as the shared client throws for
 *   a call the BE4FE answers with an error status
 */
function failure(statusCode) {
  return Object.assign(new Error(`Request failed - ${statusCode}`), {
    statusCode
  })
}

/**
 * @param {object[]} animals - the report's animals, as the shared client
 *   lists them
 * @returns {object} a submission as the shared client gives it
 */
function submission(animals) {
  return {
    submissionId: '7ZK-M3Q-A9D',
    status: 'DRAFT',
    createdDate: '2026-11-01T09:00:00Z',
    animals
  }
}

describe('CattleDeathBe4FeSubmissionClient', () => {
  beforeAll(() => {
    vi.mocked(submissions.startSubmission).mockResolvedValue(submission([]))
    vi.mocked(submissions.submit).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('startReport()', () => {
    test("it starts the holding's report", async () => {
      // Arrange
      // Act
      const result = await client.startReport({ cph: '10/081/0001' })

      // Assert
      expect(submissions.startSubmission).toHaveBeenCalledWith({
        cph: '10/081/0001'
      })
      expect(result).toEqual({
        submissionId: '7ZK-M3Q-A9D',
        animalId: undefined
      })
    })

    test("it continues the holding's report with its first animal", async () => {
      // Arrange
      vi.mocked(submissions.startSubmission).mockResolvedValueOnce(
        submission([
          { animalId: 'UK123456301550', status: 'COMPLETE' },
          { animalId: 'UK123456301551', status: 'COMPLETE' }
        ])
      )

      // Act
      const result = await client.startReport({ cph: '10/081/0002' })

      // Assert
      expect(result).toEqual({
        submissionId: '7ZK-M3Q-A9D',
        animalId: 'UK123456301550'
      })
    })

    test('it passes on a failure', async () => {
      // Arrange
      const unavailable = failure(UNAVAILABLE)
      vi.mocked(submissions.startSubmission).mockRejectedValueOnce(unavailable)

      // Act
      let thrown
      try {
        await client.startReport({ cph: '10/081/0003' })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(unavailable)
    })
  })

  describe('getSubmission()', () => {
    test('it lists the animals by ear tag number, in the order they were last saved', async () => {
      // Arrange
      vi.mocked(submissions.getSubmission).mockResolvedValueOnce(
        submission([
          { animalId: 'UK123456301551', status: 'COMPLETE' },
          { animalId: 'UK123456301550', status: 'COMPLETE' }
        ])
      )

      // Act
      const result = await client.getSubmission({
        cph: '10/081/0004',
        submissionId: '7ZK-M3Q-A9D'
      })

      // Assert
      expect(submissions.getSubmission).toHaveBeenCalledWith({
        cph: '10/081/0004',
        submissionId: '7ZK-M3Q-A9D'
      })
      expect(result).toEqual({
        submissionId: '7ZK-M3Q-A9D',
        status: 'DRAFT',
        animals: [
          { animalId: 'UK123456301551', earTagNumber: 'UK123456301551' },
          { animalId: 'UK123456301550', earTagNumber: 'UK123456301550' }
        ]
      })
    })

    test('it passes on a failure', async () => {
      // Arrange
      const notFound = failure(NOT_FOUND)
      vi.mocked(submissions.getSubmission).mockRejectedValueOnce(notFound)

      // Act
      let thrown
      try {
        await client.getSubmission({
          cph: '10/081/0005',
          submissionId: '000-000-000'
        })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(notFound)
    })
  })

  describe('submitReport()', () => {
    test('it sends the report', async () => {
      // Arrange
      // Act
      await client.submitReport({
        cph: '10/081/0006',
        submissionId: '7ZK-M3Q-A9D'
      })

      // Assert
      expect(submissions.submit).toHaveBeenCalledWith({
        cph: '10/081/0006',
        submissionId: '7ZK-M3Q-A9D'
      })
    })

    test('it passes on a failure to send', async () => {
      // Arrange
      const unavailable = failure(UNAVAILABLE)
      vi.mocked(submissions.submit).mockRejectedValueOnce(unavailable)

      // Act
      let thrown
      try {
        await client.submitReport({
          cph: '10/081/0007',
          submissionId: '7ZK-M3Q-A9D'
        })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(unavailable)
    })
  })
})
