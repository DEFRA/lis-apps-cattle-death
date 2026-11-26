import { buildViewModel, formValuesFrom } from './view-model.js'

const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456301550' }
const values = { earTagNumber: 'UK123456301550', dateOfDeath: '1/11/2026' }

describe('registered animal details view model', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-11-05T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formValuesFrom()', () => {
    test('it keeps its answers and blanks the rest, dropping anything else', () => {
      // Arrange
      const answers = { earTagNumber: 'UK123456301550', sex: 'male' }

      // Act
      const result = formValuesFrom(answers)

      // Assert
      expect(result).toEqual({
        earTagNumber: 'UK123456301550',
        dateOfDeath: ''
      })
    })
  })

  describe('buildViewModel()', () => {
    test('a new animal posts to its own page and goes back to whether it is registered', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }

      // Act
      const model = buildViewModel({
        request,
        values,
        earTagItems: ['UK123456301550']
      })

      // Assert
      expect(model).toEqual({
        pageTitle: 'Animal details',
        heading: 'Animal details',
        backLinkHref: `${REPORT_PATH}/animals/is-registered`,
        formAction: `${REPORT_PATH}/animals/registered-animal-details`,
        values,
        earTagItems: ['UK123456301550'],
        maxDateOfDeath: '5/11/2026',
        errorList: [],
        fieldErrors: {}
      })
    })

    test('a saved animal posts to its page and goes back to its is-registered', () => {
      // Arrange
      const request = { params: SAVED_ANIMAL, query: {} }

      // Act
      const model = buildViewModel({ request, values, earTagItems: [] })

      // Assert
      expect(model.formAction).toBe(
        `${REPORT_PATH}/animals/UK123456301550/registered-animal-details`
      )
      expect(model.backLinkHref).toBe(
        `${REPORT_PATH}/animals/UK123456301550/is-registered`
      )
    })

    test('after a Change link it posts still marked and goes back to check animal details', () => {
      // Arrange
      const request = { params: SAVED_ANIMAL, query: { return: 'check' } }

      // Act
      const model = buildViewModel({ request, values, earTagItems: [] })

      // Assert
      expect(model.formAction).toBe(
        `${REPORT_PATH}/animals/UK123456301550/registered-animal-details?return=check`
      )
      expect(model.backLinkHref).toBe(
        `${REPORT_PATH}/animals/UK123456301550/check-animal-details`
      )
    })

    test('it words each error in the summary, linked to its field, and on the field', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }
      const errors = [
        { field: 'earTagNumber', code: 'required' },
        { field: 'dateOfDeath', code: 'future' }
      ]

      // Act
      const model = buildViewModel({ request, values, earTagItems: [], errors })

      // Assert
      expect(model.pageTitle).toBe('Error: Animal details')
      expect(model.errorList).toEqual([
        {
          text: 'Enter all or part of the animal ear tag number you are reporting',
          href: '#earTagNumber'
        },
        {
          text: 'Date of death needs to be in the past',
          href: '#dateOfDeath'
        }
      ])
      expect(model.fieldErrors).toEqual({
        earTagNumber: {
          text: 'Enter all or part of the animal ear tag number you are reporting'
        },
        dateOfDeath: { text: 'Date of death needs to be in the past' }
      })
    })
  })
})
