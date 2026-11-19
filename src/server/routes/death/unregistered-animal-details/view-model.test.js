import { breedOptions } from '#server/journeys/death/unregistered-animal-details.js'
import { buildViewModel, formValuesFrom } from './view-model.js'

const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456401560' }
const values = {
  earTagNumber: 'UK123456401560',
  dateOfBirth: '1/11/2026',
  dateOfDeath: '3/11/2026',
  sex: 'female',
  breed: 'AA'
}

describe('unregistered animal details view model', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-11-05T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formValuesFrom()', () => {
    test('it keeps its answers and blanks the rest, dropping anything else', () => {
      // Arrange
      const answers = { earTagNumber: 'UK123456401560', isRegistered: 'no' }

      // Act
      const result = formValuesFrom(answers)

      // Assert
      expect(result).toEqual({
        earTagNumber: 'UK123456401560',
        dateOfBirth: '',
        dateOfDeath: '',
        sex: '',
        breed: ''
      })
    })
  })

  describe('buildViewModel()', () => {
    test('a new animal posts to its own page and goes back to whether it is registered', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }

      // Act
      const model = buildViewModel({ request, values, earTagItems: ['UK1'] })

      // Assert
      expect(model).toEqual({
        pageTitle: 'Animal details',
        heading: 'Animal details',
        backLinkHref: `${REPORT_PATH}/animals/is-registered`,
        formAction: `${REPORT_PATH}/animals/unregistered-animal-details`,
        values,
        earTagItems: ['UK1'],
        breedItems: breedOptions,
        maxDate: '5/11/2026',
        errorList: [],
        fieldErrors: {}
      })
    })

    test('after a Change link a saved animal posts still marked and goes back to check animal details', () => {
      // Arrange
      const request = { params: SAVED_ANIMAL, query: { return: 'check' } }

      // Act
      const model = buildViewModel({ request, values, earTagItems: [] })

      // Assert
      expect(model.formAction).toBe(
        `${REPORT_PATH}/animals/UK123456401560/unregistered-animal-details?return=check`
      )
      expect(model.backLinkHref).toBe(
        `${REPORT_PATH}/animals/UK123456401560/check-animal-details`
      )
    })

    test('it words each error in the summary, linked to its field, and on the field', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }
      const errors = [{ field: 'sex', code: 'required' }]

      // Act
      const model = buildViewModel({ request, values, earTagItems: [], errors })

      // Assert
      expect(model.pageTitle).toBe('Error: Animal details')
      expect(model.errorList).toEqual([
        { text: 'Select if the animal is male or female', href: '#sex' }
      ])
      expect(model.fieldErrors).toEqual({
        sex: { text: 'Select if the animal is male or female' }
      })
    })
  })
})
