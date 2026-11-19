import { saveAnimal } from './animal.js'
import { getHoldingCattle, getUnusedEarTags } from './data.js'
import { getSubmission, startReport, submitReport } from './submission.js'

const SUBMISSION_ID =
  /^[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$/

let holdingCount = 0

/**
 * @returns {{ cph: string, userId: string }} a keeper on a holding no other
 *   test has used, so each starts with the fixtures and no reports
 */
function freshKeeper() {
  holdingCount += 1
  return {
    cph: `30/001/${String(holdingCount).padStart(4, '0')}`,
    userId: 'keeper-1'
  }
}

/**
 * @param {{ cph: string, userId: string }} keeper
 * @param {object[]} deaths - each animal's answers
 * @returns {Promise<{ cph: string, userId: string, submissionId: string }>}
 *   a report holding the animals
 */
async function reportWith(keeper, deaths) {
  const { submissionId } = await startReport(keeper)
  const report = { ...keeper, submissionId }

  for (const values of deaths) {
    await saveAnimal({ ...report, values })
  }

  return report
}

describe('temporary death report submissions', () => {
  describe('startReport()', () => {
    test('it starts a report with an id in the BE4FE format and no animal', async () => {
      // Arrange
      const keeper = freshKeeper()

      // Act
      const started = await startReport(keeper)

      // Assert
      expect(started).toEqual({
        submissionId: expect.stringMatching(SUBMISSION_ID)
      })
      expect(
        await getSubmission({ ...keeper, submissionId: started.submissionId })
      ).toEqual({
        submissionId: started.submissionId,
        status: 'DRAFT',
        animals: []
      })
    })

    test('it continues the report the keeper has not sent, at its first animal', async () => {
      // Arrange
      const keeper = freshKeeper()
      const report = await reportWith(keeper, [
        { earTagNumber: 'UK 123456 301550' },
        { earTagNumber: 'UK123456301551' }
      ])

      // Act
      const started = await startReport(keeper)

      // Assert
      expect(started).toEqual({
        submissionId: report.submissionId,
        animalId: 'UK123456301550'
      })
    })

    test('it continues a report with no animal yet, with no animalId', async () => {
      // Arrange
      const keeper = freshKeeper()
      const { submissionId: first } = await startReport(keeper)

      // Act
      const started = await startReport(keeper)

      // Assert
      expect(started).toEqual({ submissionId: first, animalId: undefined })
    })

    test("it starts another keeper's report on the same holding apart", async () => {
      // Arrange
      const keeper = freshKeeper()
      const { submissionId: first } = await startReport(keeper)

      // Act
      const { submissionId } = await startReport({
        ...keeper,
        userId: 'keeper-2'
      })

      // Assert
      expect(submissionId).not.toBe(first)
    })

    test('it starts a new report once the last one is sent', async () => {
      // Arrange
      const keeper = freshKeeper()
      const sent = await reportWith(keeper, [
        { isRegistered: 'yes', earTagNumber: 'UK123456301550' }
      ])
      await submitReport(sent)

      // Act
      const { submissionId } = await startReport(keeper)

      // Assert
      expect(submissionId).not.toBe(sent.submissionId)
    })
  })

  describe('getSubmission()', () => {
    test('it lists the animals by ear tag number, in the order they were last saved', async () => {
      // Arrange
      const keeper = freshKeeper()
      const report = await reportWith(keeper, [
        { earTagNumber: 'UK123456301551' },
        { earTagNumber: 'UK123456301552' }
      ])
      await saveAnimal({
        ...report,
        animalId: 'UK123456301551',
        values: { earTagNumber: 'UK123456301551' }
      })

      // Act
      const { animals } = await getSubmission(report)

      // Assert
      expect(animals).toEqual([
        { animalId: 'UK123456301552', earTagNumber: 'UK123456301552' },
        { animalId: 'UK123456301551', earTagNumber: 'UK123456301551' }
      ])
    })

    test('it reads the id whatever its case', async () => {
      // Arrange
      const keeper = freshKeeper()
      const { submissionId } = await startReport(keeper)

      // Act
      const report = await getSubmission({
        ...keeper,
        submissionId: submissionId.toLowerCase()
      })

      // Assert
      expect(report.submissionId).toBe(submissionId)
    })

    test.each([
      ['another keeper', { userId: 'keeper-2' }],
      ['another holding', { cph: '30/999/9999' }],
      ['an unknown id', { submissionId: '000-000-000' }]
    ])('it answers not found for %s', async (_description, other) => {
      // Arrange
      const keeper = freshKeeper()
      const { submissionId } = await startReport(keeper)

      // Act
      let error
      try {
        await getSubmission({ ...keeper, submissionId, ...other })
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
    })
  })

  describe('submitReport()', () => {
    test('it sends every animal: a registered one is then dead, an unregistered one a dead animal on its tag', async () => {
      // Arrange
      const keeper = freshKeeper()
      const report = await reportWith(keeper, [
        { isRegistered: 'yes', earTagNumber: 'UK123456301550' },
        { isRegistered: 'no', earTagNumber: 'UK123456401560' }
      ])

      // Act
      await submitReport(report)

      // Assert
      expect((await getSubmission(report)).status).toBe('SUBMITTED')
      expect(await getHoldingCattle(keeper)).toEqual(
        expect.arrayContaining([
          { earTagNumber: 'UK123456301550', status: 'dead' },
          { earTagNumber: 'UK123456401560', status: 'dead' }
        ])
      )
      const { submissionId } = await startReport(keeper)
      expect(await getUnusedEarTags({ ...keeper, submissionId })).not.toContain(
        'UK123456401560'
      )
    })

    test('it does not send a report twice', async () => {
      // Arrange
      const keeper = freshKeeper()
      const report = await reportWith(keeper, [
        { isRegistered: 'no', earTagNumber: 'UK123456401561' }
      ])
      await submitReport(report)

      // Act
      await submitReport(report)

      // Assert
      const sameTag = (await getHoldingCattle(keeper)).filter(
        ({ earTagNumber }) => earTagNumber === 'UK123456401561'
      )
      expect(sameTag).toHaveLength(1)
    })

    test.each(['UK123456301554', 'uk 123456 401564'])(
      'it fails to send a report with %s in it and keeps it unsent',
      async (earTagNumber) => {
        // Arrange
        const keeper = freshKeeper()
        const report = await reportWith(keeper, [
          { isRegistered: 'yes', earTagNumber: 'UK123456301550' },
          { isRegistered: 'yes', earTagNumber }
        ])

        // Act
        let error
        try {
          await submitReport(report)
        } catch (e) {
          error = e
        }

        // Assert
        expect(error.output.statusCode).toBe(503)
        expect((await getSubmission(report)).status).toBe('DRAFT')
        expect(await getHoldingCattle(keeper)).toContainEqual({
          earTagNumber: 'UK123456301550',
          status: 'alive'
        })
      }
    )

    test('it answers not found for a report the keeper does not have', async () => {
      // Arrange
      const keeper = freshKeeper()

      // Act
      let error
      try {
        await submitReport({ ...keeper, submissionId: '000-000-000' })
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
    })
  })
})
