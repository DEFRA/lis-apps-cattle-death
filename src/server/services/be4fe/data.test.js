import {
  be4fe,
  earTagsPath,
  holdingDataPath
} from '#server/services/be4fe/client.js'
import * as client from './data.js'
import { getSubmission } from './submission.js'

vi.mock('#server/services/be4fe/client.js')
vi.mock('./submission.js')

const NOT_FOUND = 404

describe('CattleDeathBe4FeDataClient', () => {
  beforeAll(() => {
    vi.mocked(holdingDataPath).mockImplementation((cph) => `data/${cph}`)
    vi.mocked(earTagsPath).mockImplementation((cph) => `data/${cph}/ear-tags`)
    vi.mocked(getSubmission).mockResolvedValue({
      submissionId: '7ZK-M3Q-A9D',
      status: 'DRAFT',
      animals: []
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getHoldingCattle()', () => {
    test("it lists the ear tag numbers of the holding's cattle", async () => {
      // Arrange
      vi.mocked(be4fe.get).mockResolvedValueOnce({
        payload: {
          cph: '10/081/1234',
          animals: [
            { eartag: 'UK123456301550', breed: 'AA', sex: 'F', children: [] },
            { eartag: 'UK123456301551', breed: 'HE', sex: 'M', children: [] }
          ]
        }
      })

      // Act
      const result = await client.getHoldingCattle({ cph: '10/081/1234' })

      // Assert
      expect(be4fe.get).toHaveBeenCalledWith('data/10/081/1234/animals')
      expect(result).toEqual([
        { earTagNumber: 'UK123456301550' },
        { earTagNumber: 'UK123456301551' }
      ])
    })

    test('it returns no cattle when the holding has none', async () => {
      // Arrange
      vi.mocked(be4fe.get).mockResolvedValueOnce({
        payload: { cph: '10/081/1234' }
      })

      // Act
      const result = await client.getHoldingCattle({ cph: '10/081/1234' })

      // Assert
      expect(result).toEqual([])
    })

    test('it passes on not found for a holding the BE4FE does not know', async () => {
      // Arrange
      const notFound = Object.assign(new Error('not found'), {
        statusCode: NOT_FOUND
      })
      vi.mocked(be4fe.get).mockRejectedValueOnce(notFound)

      // Act
      let thrown
      try {
        await client.getHoldingCattle({ cph: '10/081/9999' })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(notFound)
    })
  })

  describe('getUnusedEarTags()', () => {
    test("it lists the holding's unallocated ear tags that the report does not use", async () => {
      // Arrange
      vi.mocked(getSubmission).mockResolvedValueOnce({
        submissionId: '7ZK-M3Q-A9D',
        status: 'DRAFT',
        animals: [
          { animalId: 'UK123456301551', earTagNumber: 'UK123456301551' }
        ]
      })
      vi.mocked(be4fe.get).mockResolvedValueOnce({
        payload: {
          cph: '10/081/1234',
          eartags: [
            { eartag: 'UK 123456 301550' },
            { eartag: 'UK 123456 301551' }
          ]
        }
      })

      // Act
      const result = await client.getUnusedEarTags({
        cph: '10/081/1234',
        submissionId: '7ZK-M3Q-A9D'
      })

      // Assert
      expect(getSubmission).toHaveBeenCalledWith({
        cph: '10/081/1234',
        submissionId: '7ZK-M3Q-A9D'
      })
      expect(be4fe.get).toHaveBeenCalledWith(
        'data/10/081/1234/ear-tags/unallocated'
      )
      expect(result).toEqual(['UK 123456 301550'])
    })

    test('it returns no ear tags when the holding has none', async () => {
      // Arrange
      vi.mocked(be4fe.get).mockResolvedValueOnce({
        payload: { cph: '10/081/1234', eartags: [] }
      })

      // Act
      const result = await client.getUnusedEarTags({
        cph: '10/081/1234',
        submissionId: '7ZK-M3Q-A9D'
      })

      // Assert
      expect(result).toEqual([])
    })

    test('it returns no ear tags when the answer lists none', async () => {
      // Arrange
      vi.mocked(be4fe.get).mockResolvedValueOnce({
        payload: { cph: '10/081/1234' }
      })

      // Act
      const result = await client.getUnusedEarTags({
        cph: '10/081/1234',
        submissionId: '7ZK-M3Q-A9D'
      })

      // Assert
      expect(result).toEqual([])
    })

    test('it passes on not found for a report the BE4FE does not hold', async () => {
      // Arrange
      const notFound = Object.assign(new Error('not found'), {
        statusCode: NOT_FOUND
      })
      vi.mocked(getSubmission).mockRejectedValueOnce(notFound)

      // Act
      let thrown
      try {
        await client.getUnusedEarTags({
          cph: '10/081/1234',
          submissionId: '000-000-000'
        })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(notFound)
      expect(be4fe.get).not.toHaveBeenCalled()
    })

    test('it passes on not found for a holding the BE4FE does not know', async () => {
      // Arrange
      const notFound = Object.assign(new Error('not found'), {
        statusCode: NOT_FOUND
      })
      vi.mocked(be4fe.get).mockRejectedValueOnce(notFound)

      // Act
      let thrown
      try {
        await client.getUnusedEarTags({
          cph: '10/081/9999',
          submissionId: '7ZK-M3Q-A9D'
        })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(notFound)
    })
  })
})
