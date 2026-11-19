import { getAnimal, saveAnimal } from './animal.js'
import { getSubmission, startReport, submitReport } from './submission.js'

let holdingCount = 0

/**
 * @returns {Promise<{ cph: string, userId: string, submissionId: string }>}
 *   a new report on a holding no other test has used
 */
async function freshReport() {
  holdingCount += 1
  const keeper = {
    cph: `32/001/${String(holdingCount).padStart(4, '0')}`,
    userId: 'keeper-1'
  }
  const { submissionId } = await startReport(keeper)

  return { ...keeper, submissionId }
}

describe('temporary death report animals', () => {
  describe('saveAnimal()', () => {
    test('it adds a new animal under its ear tag number without spaces, keeping the answer as given', async () => {
      // Arrange
      const report = await freshReport()
      const values = { isRegistered: 'yes', earTagNumber: 'uk 123456 301550' }

      // Act
      const { animalId } = await saveAnimal({ ...report, values })

      // Assert
      expect(animalId).toBe('UK123456301550')
      expect(await getAnimal({ ...report, animalId })).toEqual(values)
    })

    test('it replaces an animal saved under the same id', async () => {
      // Arrange
      const report = await freshReport()
      await saveAnimal({
        ...report,
        values: { isRegistered: 'yes', earTagNumber: 'UK123456301550' }
      })

      // Act
      await saveAnimal({
        ...report,
        animalId: 'UK123456301550',
        values: {
          isRegistered: 'yes',
          earTagNumber: 'UK123456301550',
          dateOfDeath: '1/11/2026'
        }
      })

      // Assert
      expect((await getSubmission(report)).animals).toHaveLength(1)
      expect(
        await getAnimal({ ...report, animalId: 'UK123456301550' })
      ).toEqual({
        isRegistered: 'yes',
        earTagNumber: 'UK123456301550',
        dateOfDeath: '1/11/2026'
      })
    })

    test('it moves an animal whose ear tag number changed to its new id', async () => {
      // Arrange
      const report = await freshReport()
      await saveAnimal({
        ...report,
        values: { earTagNumber: 'UK123456301550' }
      })

      // Act
      const { animalId } = await saveAnimal({
        ...report,
        animalId: 'UK123456301550',
        values: { earTagNumber: 'UK123456301551' }
      })

      // Assert
      expect(animalId).toBe('UK123456301551')
      expect((await getSubmission(report)).animals).toEqual([
        { animalId: 'UK123456301551', earTagNumber: 'UK123456301551' }
      ])
    })

    test('it refuses, as a conflict, a report already sent, keeping it as sent', async () => {
      // Arrange
      const report = await freshReport()
      const values = { isRegistered: 'yes', earTagNumber: 'UK123456301550' }
      await saveAnimal({ ...report, values })
      await submitReport(report)

      // Act
      let error
      try {
        await saveAnimal({
          ...report,
          values: { isRegistered: 'yes', earTagNumber: 'UK123456301551' }
        })
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(409)
      expect((await getSubmission(report)).animals).toEqual([
        { animalId: 'UK123456301550', earTagNumber: 'UK123456301550' }
      ])
    })

    test('it answers not found for a report the keeper does not have', async () => {
      // Arrange
      const report = await freshReport()

      // Act
      let error
      try {
        await saveAnimal({
          ...report,
          submissionId: '000-000-000',
          values: { earTagNumber: 'UK123456301550' }
        })
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
    })
  })

  describe('getAnimal()', () => {
    test('it reads an id whatever its case', async () => {
      // Arrange
      const report = await freshReport()
      await saveAnimal({
        ...report,
        values: { earTagNumber: 'UK123456301550' }
      })

      // Act
      const death = await getAnimal({ ...report, animalId: 'uk123456301550' })

      // Assert
      expect(death).toEqual({ earTagNumber: 'UK123456301550' })
    })

    test('it answers not found for an animal the report does not have', async () => {
      // Arrange
      const report = await freshReport()

      // Act
      let error
      try {
        await getAnimal({ ...report, animalId: 'UK123456301550' })
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
    })
  })
})
