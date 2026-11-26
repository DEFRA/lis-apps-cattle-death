import { buildViewModel } from './view-model.js'

const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const request = { params: { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' } }
const ready = {
  animalId: 'UK123456301550',
  earTagNumber: 'UK123456301550',
  page: 'check-animal-details',
  isReady: true
}
const unfinished = {
  animalId: 'UK123456401560',
  earTagNumber: 'UK123456401560',
  page: 'unregistered-animal-details',
  isReady: false
}

describe('tag list view model', () => {
  test('it lists each animal by ear tag, linked to where it continues, with its status', () => {
    // Arrange
    const animals = [ready, unfinished]

    // Act
    const model = buildViewModel({ request, animals })

    // Assert
    expect(model).toEqual({
      pageTitle: 'Report cattle deaths',
      heading: 'Report cattle deaths',
      backLinkHref: `${REPORT_PATH}/animals/UK123456401560/unregistered-animal-details`,
      formAction: REPORT_PATH,
      animals: [
        {
          id: 'animal-UK123456301550',
          earTagNumber: 'UK 123456 301550',
          href: `${REPORT_PATH}/animals/UK123456301550/check-animal-details`,
          isReady: true
        },
        {
          id: 'animal-UK123456401560',
          earTagNumber: 'UK 123456 401560',
          href: `${REPORT_PATH}/animals/UK123456401560/unregistered-animal-details`,
          isReady: false
        }
      ],
      values: { addAnother: '' },
      errorList: [],
      fieldErrors: {}
    })
  })

  test('with no animals it lists none, which shows the empty state without the intro, and goes back to where the first is added', () => {
    // Arrange
    const animals = []

    // Act
    const model = buildViewModel({ request, animals })

    // Assert
    expect(model.animals).toEqual([])
    expect(model.backLinkHref).toBe(`${REPORT_PATH}/animals/is-registered`)
  })

  test('it links the incomplete error to the first animal to finish, and others to their field', () => {
    // Arrange
    const errors = [
      { field: 'animals', code: 'incomplete' },
      { field: 'addAnother', code: 'required' }
    ]

    // Act
    const model = buildViewModel({
      request,
      animals: [ready, unfinished],
      addAnother: 'no',
      errors
    })

    // Assert
    expect(model.pageTitle).toBe('Error: Report cattle deaths')
    expect(model.values).toEqual({ addAnother: 'no' })
    expect(model.errorList).toEqual([
      {
        text: 'Complete all required animal details before continuing',
        href: '#animal-UK123456401560'
      },
      {
        text: 'Select yes to add more animals or no to continue.',
        href: '#addAnother'
      }
    ])
    expect(model.fieldErrors.addAnother).toEqual({
      text: 'Select yes to add more animals or no to continue.'
    })
  })
})
