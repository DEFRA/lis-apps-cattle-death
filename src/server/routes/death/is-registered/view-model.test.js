import { buildViewModel, formValuesFrom } from './view-model.js'

const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456301550' }

describe('is-registered view model', () => {
  describe('formValuesFrom()', () => {
    test.each([
      [{ isRegistered: 'yes', sex: 'male' }, { isRegistered: 'yes' }],
      [{}, { isRegistered: '' }]
    ])('it gives %j as %j', (answers, expected) => {
      // Arrange
      // Act
      const values = formValuesFrom(answers)

      // Assert
      expect(values).toEqual(expected)
    })
  })

  describe('buildViewModel()', () => {
    test('it asks the question as the heading, posting a new animal to its own page', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }

      // Act
      const model = buildViewModel({
        request,
        values: { isRegistered: '' },
        isFirstAnimal: true
      })

      // Assert
      expect(model).toEqual({
        pageTitle: 'Is the animal registered to your holding?',
        heading: 'Is the animal registered to your holding?',
        backLinkHref: '/holdings/10/081/1234/cattle',
        formAction: `${REPORT_PATH}/animals/is-registered`,
        values: { isRegistered: '' },
        errorList: [],
        fieldErrors: {}
      })
    })

    test('it goes back to the list of animals from any but the first', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }

      // Act
      const model = buildViewModel({ request, values: { isRegistered: '' } })

      // Assert
      expect(model.backLinkHref).toBe(REPORT_PATH)
    })

    test('a saved animal reached from a Change link posts to its page, still marked, and goes back to check animal details', () => {
      // Arrange
      const request = { params: SAVED_ANIMAL, query: { return: 'check' } }

      // Act
      const model = buildViewModel({ request, values: { isRegistered: 'yes' } })

      // Assert
      expect(model.formAction).toBe(
        `${REPORT_PATH}/animals/UK123456301550/is-registered?return=check`
      )
      expect(model.backLinkHref).toBe(
        `${REPORT_PATH}/animals/UK123456301550/check-animal-details`
      )
    })

    test('it words an error in the summary and on the field', () => {
      // Arrange
      const request = { params: NEW_ANIMAL, query: {} }
      const errors = [{ field: 'isRegistered', code: 'required' }]

      // Act
      const model = buildViewModel({
        request,
        values: { isRegistered: '' },
        errors
      })

      // Assert
      const text =
        'Select if the animal is registered on your holding or not to continue'
      expect(model.pageTitle).toBe(
        'Error: Is the animal registered to your holding?'
      )
      expect(model.errorList).toEqual([{ text, href: '#isRegistered' }])
      expect(model.fieldErrors).toEqual({ isRegistered: { text } })
    })
  })
})
