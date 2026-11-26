import { submissions } from '#server/services/be4fe/client.js'
import * as client from './animal.js'

vi.mock('#server/services/be4fe/client.js')

const CONFLICT = 409

const validAnswers = {
  isRegistered: 'yes',
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}

const validItems = [
  { key: 'isRegistered', value: 'yes', type: 'STRING' },
  { key: 'earTagNumber', value: 'UK123456301550', type: 'STRING' },
  { key: 'dateOfDeath', value: '2026-11-01', type: 'DATE' }
]

const KEY = {
  cph: '10/081/1234',
  submissionId: '7ZK-M3Q-A9D',
  animalId: 'UK123456301550'
}

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

describe('CattleDeathBe4FeAnimalClient', () => {
  beforeAll(() => {
    vi.mocked(submissions.saveAnimal).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnimal()', () => {
    test("it reads the animal's answers from its data items", async () => {
      // Arrange
      vi.mocked(submissions.getAnimal).mockResolvedValueOnce({
        animalId: 'UK123456301550',
        status: 'COMPLETE',
        data: validItems
      })

      // Act
      const result = await client.getAnimal(KEY)

      // Assert
      expect(submissions.getAnimal).toHaveBeenCalledWith(KEY)
      expect(result).toEqual(validAnswers)
    })

    test('it asks for the animal by its ear tag number without spaces', async () => {
      // Arrange
      vi.mocked(submissions.getAnimal).mockResolvedValueOnce({
        animalId: 'UK123456301550',
        status: 'COMPLETE',
        data: validItems
      })

      // Act
      await client.getAnimal({ ...KEY, animalId: 'uk 123456 301550' })

      // Assert
      expect(submissions.getAnimal).toHaveBeenCalledWith(KEY)
    })

    test('it gives a date the BE4FE holds in another form as it is', async () => {
      // Arrange
      vi.mocked(submissions.getAnimal).mockResolvedValueOnce({
        animalId: 'UK123456301550',
        status: 'COMPLETE',
        data: [{ key: 'dateOfDeath', value: 'last week', type: 'DATE' }]
      })

      // Act
      const result = await client.getAnimal(KEY)

      // Assert
      expect(result).toEqual({ dateOfDeath: 'last week' })
    })

    test('it reads an answer given as nothing as null', async () => {
      // Arrange
      vi.mocked(submissions.getAnimal).mockResolvedValueOnce({
        animalId: 'UK123456301550',
        status: 'COMPLETE',
        data: [{ key: 'dateOfDeath', value: null, type: 'DATE' }]
      })

      // Act
      const result = await client.getAnimal(KEY)

      // Assert
      expect(result).toEqual({ dateOfDeath: null })
    })

    test('it passes on a failure', async () => {
      // Arrange
      const conflict = failure(CONFLICT)
      vi.mocked(submissions.getAnimal).mockRejectedValueOnce(conflict)

      // Act
      let thrown
      try {
        await client.getAnimal(KEY)
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(conflict)
    })
  })

  describe('saveAnimal()', () => {
    test('it saves a new animal as complete under its ear tag number', async () => {
      // Arrange
      const { animalId, ...report } = KEY

      // Act
      const result = await client.saveAnimal({
        ...report,
        values: validAnswers
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith({
        ...report,
        animalId: 'UK123456301550',
        previousAnimalId: undefined,
        status: 'COMPLETE',
        data: validItems
      })
      expect(result).toEqual({ animalId })
    })

    test('it replaces an animal saved with the same ear tag number', async () => {
      // Arrange
      // Act
      const result = await client.saveAnimal({ ...KEY, values: validAnswers })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          animalId: 'UK123456301550',
          previousAnimalId: 'UK123456301550'
        })
      )
      expect(result).toEqual({ animalId: 'UK123456301550' })
    })

    test('it saves an animal given another ear tag number under that, with the old id as the previous one', async () => {
      // Arrange
      // Act
      const result = await client.saveAnimal({
        ...KEY,
        animalId: 'UK123456301551',
        values: validAnswers
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          animalId: 'UK123456301550',
          previousAnimalId: 'UK123456301551'
        })
      )
      expect(result).toEqual({ animalId: 'UK123456301550' })
    })

    test('it saves an animal whose ear tag number has spaces and lower case under the number without them', async () => {
      // Arrange
      // Act
      const result = await client.saveAnimal({
        ...KEY,
        animalId: undefined,
        values: { earTagNumber: 'uk 123456 301550' }
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          animalId: 'UK123456301550',
          data: [
            { key: 'earTagNumber', value: 'uk 123456 301550', type: 'STRING' }
          ]
        })
      )
      expect(result).toEqual({ animalId: 'UK123456301550' })
    })

    test('it saves an animal with no ear tag number under the id it has', async () => {
      // Arrange
      // Act
      const result = await client.saveAnimal({
        ...KEY,
        values: { isRegistered: 'yes' }
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ animalId: 'UK123456301550' })
      )
      expect(result).toEqual({ animalId: 'UK123456301550' })
    })

    test('it sends a date as an ISO date', async () => {
      // Arrange
      // Act
      await client.saveAnimal({
        ...KEY,
        values: { earTagNumber: 'UK123456301550', dateOfDeath: '29/2/2028' }
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { key: 'earTagNumber', value: 'UK123456301550', type: 'STRING' },
            { key: 'dateOfDeath', value: '2028-02-29', type: 'DATE' }
          ]
        })
      )
    })

    test('it leaves out an absent answer', async () => {
      // Arrange
      // Act
      await client.saveAnimal({
        ...KEY,
        values: { earTagNumber: 'UK123456301550', dateOfBirth: undefined }
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { key: 'earTagNumber', value: 'UK123456301550', type: 'STRING' }
          ]
        })
      )
    })

    test('it sends an answer given as nothing with a null value', async () => {
      // Arrange
      // Act
      await client.saveAnimal({
        ...KEY,
        values: { earTagNumber: 'UK123456301550', dateOfBirth: null }
      })

      // Assert
      expect(submissions.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { key: 'earTagNumber', value: 'UK123456301550', type: 'STRING' },
            { key: 'dateOfBirth', value: null, type: 'DATE' }
          ]
        })
      )
    })

    test('it passes on a failure to save', async () => {
      // Arrange
      const conflict = failure(CONFLICT)
      vi.mocked(submissions.saveAnimal).mockRejectedValueOnce(conflict)

      // Act
      let thrown
      try {
        await client.saveAnimal({ ...KEY, values: validAnswers })
      } catch (error) {
        thrown = error
      }

      // Assert
      expect(thrown).toBe(conflict)
    })
  })
})
