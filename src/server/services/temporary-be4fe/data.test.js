import { saveAnimal } from './animal.js'
import { getHoldingCattle, getUnusedEarTags } from './data.js'
import { recordDeath } from './holdings.js'
import { startReport } from './submission.js'

/**
 * @param {string} cph
 * @returns {Promise<{ cph: string, userId: string, submissionId: string }>}
 *   a new report on the holding
 */
async function reportOn(cph) {
  const keeper = { cph, userId: 'keeper-1' }
  const { submissionId } = await startReport(keeper)

  return { ...keeper, submissionId }
}

describe('temporary holding data', () => {
  describe('getHoldingCattle()', () => {
    test("it lists the holding's cattle, alive and dead", async () => {
      // Arrange
      const holding = { cph: '31/001/0001' }

      // Act
      const cattle = await getHoldingCattle(holding)

      // Assert
      expect(cattle).toEqual([
        { earTagNumber: 'UK123456301550', status: 'alive' },
        { earTagNumber: 'UK123456301551', status: 'alive' },
        { earTagNumber: 'UK123456301552', status: 'alive' },
        { earTagNumber: 'UK123456301553', status: 'dead' },
        { earTagNumber: 'UK123456301554', status: 'alive' }
      ])
    })

    test('it gives a copy that changing does not change the holding', async () => {
      // Arrange
      const holding = { cph: '31/001/0002' }
      const [first] = await getHoldingCattle(holding)
      first.status = 'dead'

      // Act
      const [again] = await getHoldingCattle(holding)

      // Assert
      expect(again.status).toBe('alive')
    })

    test('it gives a registered animal reported dead as dead', async () => {
      // Arrange
      recordDeath('31/001/0006', {
        isRegistered: 'yes',
        earTagNumber: 'uk 123456 301551'
      })

      // Act
      const cattle = await getHoldingCattle({ cph: '31/001/0006' })

      // Assert
      expect(cattle).toContainEqual({
        earTagNumber: 'UK123456301551',
        status: 'dead'
      })
    })
  })

  describe('getUnusedEarTags()', () => {
    test('it lists the ear tags issued to the holding not on an animal', async () => {
      // Arrange
      const report = await reportOn('31/001/0003')

      // Act
      const earTags = await getUnusedEarTags(report)

      // Assert
      expect(earTags).toEqual([
        'UK123456401560',
        'UK123456401561',
        'UK123456401562',
        'UK123456401563',
        'UK123456401564'
      ])
    })

    test('it leaves out a tag another animal of the report has', async () => {
      // Arrange
      const report = await reportOn('31/001/0007')
      await saveAnimal({
        ...report,
        values: { isRegistered: 'no', earTagNumber: 'UK123456401563' }
      })

      // Act
      const earTags = await getUnusedEarTags(report)

      // Assert
      expect(earTags).not.toContain('UK123456401563')
    })

    test("it leaves out a tag on a dead animal reported on the holding, but not another holding's", async () => {
      // Arrange
      recordDeath('31/001/0004', {
        isRegistered: 'no',
        earTagNumber: 'UK 123456 401562'
      })

      // Act
      const reported = await getUnusedEarTags(await reportOn('31/001/0004'))
      const other = await getUnusedEarTags(await reportOn('31/001/0005'))

      // Assert
      expect(reported).not.toContain('UK123456401562')
      expect(other).toContain('UK123456401562')
    })
  })
})
