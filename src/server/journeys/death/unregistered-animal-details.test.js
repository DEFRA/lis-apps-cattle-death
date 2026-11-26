import { deathReport } from './report.js'
import { breedOptions } from './unregistered-animal-details.js'

const NOW = new Date('2026-11-05T10:00:00Z')
const UNUSED = ['UK123456401560', 'UK123456401561']
const validAnswers = {
  earTagNumber: 'UK123456401560',
  dateOfBirth: '1/11/2026',
  dateOfDeath: '3/11/2026',
  sex: 'female',
  breed: 'AA'
}

/**
 * @param {object} answers
 * @param {object} [saved] - the animal as saved
 * @param {string[]} [reportedEarTags]
 * @returns {{ errors: object[] }} what the unregistered animal details rules
 *   make of the answers
 */
function validate(
  answers,
  saved = { isRegistered: 'no' },
  reportedEarTags = []
) {
  return deathReport.validateStep(
    'unregistered-animal-details',
    saved,
    answers,
    { unusedEarTags: UNUSED, reportedEarTags }
  )
}

describe('unregistered animal details rules', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('breedOptions shows each breed as its name and code, and submits the code', () => {
    // Arrange
    // Act
    const [first] = breedOptions

    // Assert
    expect(first).toEqual({ value: 'AA', text: 'Aberdeen Angus (AA)' })
  })

  test.each([
    ['valid answers', validAnswers],
    [
      'a tag typed in lower case with spaces',
      { ...validAnswers, earTagNumber: 'uk 123456 401561' }
    ],
    [
      'a birth and death on the same day',
      { ...validAnswers, dateOfDeath: '1/11/2026' }
    ]
  ])('it takes %s', (_description, answers) => {
    // Arrange
    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([])
  })

  test('it takes the ear tag the animal already has, which is no longer unused', () => {
    // Arrange
    const saved = { isRegistered: 'no', earTagNumber: 'UK123456401569' }
    const answers = { ...validAnswers, earTagNumber: 'UK123456401569' }

    // Act
    const { errors } = validate(answers, saved)

    // Assert
    expect(errors).toEqual([])
  })

  test('it refuses an ear tag that is not one of the unused ones', () => {
    // Arrange
    const answers = { ...validAnswers, earTagNumber: 'UK123456301550' }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([{ field: 'earTagNumber', code: 'notAvailable' }])
  })

  test('it refuses an ear tag of another animal in the report', () => {
    // Arrange
    const answers = { ...validAnswers, earTagNumber: 'uk 123456 401561' }

    // Act
    const { errors } = validate(answers, undefined, ['UK123456401561'])

    // Assert
    expect(errors).toEqual([{ field: 'earTagNumber', code: 'alreadyReported' }])
  })

  test('it asks for every answer left blank, in the order of the page', () => {
    // Arrange
    const answers = {
      earTagNumber: '',
      dateOfBirth: '',
      dateOfDeath: '',
      sex: '',
      breed: ''
    }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([
      { field: 'earTagNumber', code: 'required' },
      { field: 'dateOfBirth', code: 'required' },
      { field: 'dateOfDeath', code: 'required' },
      { field: 'sex', code: 'required' },
      { field: 'breed', code: 'required' }
    ])
  })

  test.each([
    [
      'a future date of birth',
      { dateOfBirth: '6/11/2026', dateOfDeath: '6/11/2026' },
      [
        { field: 'dateOfBirth', code: 'future' },
        { field: 'dateOfDeath', code: 'future' }
      ]
    ],
    [
      'a date of death before birth',
      { dateOfDeath: '31/10/2026' },
      [{ field: 'dateOfDeath', code: 'beforeBirth' }]
    ],
    [
      'dates that are not real',
      { dateOfBirth: '30/2/2026', dateOfDeath: '1/13/2026' },
      [
        { field: 'dateOfBirth', code: 'invalid' },
        { field: 'dateOfDeath', code: 'invalid' }
      ]
    ],
    [
      'a sex other than male or female',
      { sex: 'other' },
      [{ field: 'sex', code: 'required' }]
    ],
    [
      'a breed that is not a code',
      { breed: 'Aberdeen Angus' },
      [{ field: 'breed', code: 'unknown' }]
    ]
  ])('it refuses %s', (_description, changed, expected) => {
    // Arrange
    const answers = { ...validAnswers, ...changed }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual(expected)
  })

  test('it does not judge the date of death against a date of birth that is not a date', () => {
    // Arrange
    const answers = { ...validAnswers, dateOfBirth: 'soon' }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([{ field: 'dateOfBirth', code: 'invalid' }])
  })
})
