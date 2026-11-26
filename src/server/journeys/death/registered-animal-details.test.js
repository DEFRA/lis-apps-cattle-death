import { deathReport } from './report.js'

const NOW = new Date('2026-11-05T10:00:00Z')
const holdingCattle = [
  { earTagNumber: 'UK123456301550' },
  { earTagNumber: 'UK123456301551' }
]
const validAnswers = {
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}

/**
 * @param {object} answers
 * @param {string[]} [reportedEarTags]
 * @returns {{ errors: object[] }} what the registered animal details rules
 *   make of the answers for a new registered animal
 */
function validate(answers, reportedEarTags = []) {
  return deathReport.validateStep(
    'registered-animal-details',
    { isRegistered: 'yes' },
    answers,
    { holdingCattle, reportedEarTags }
  )
}

describe('registered animal details rules', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test.each([
    ['as listed', 'UK123456301550'],
    ['in lower case with spaces', 'uk 123456 301550']
  ])(
    'it takes a living animal of the holding typed %s',
    (_description, earTagNumber) => {
      // Arrange
      const answers = { ...validAnswers, earTagNumber }

      // Act
      const { errors } = validate(answers)

      // Assert
      expect(errors).toEqual([])
    }
  )

  test.each([
    ['is not one of the holding', 'UK999999999999', [], 'notOnHolding'],
    [
      'is of another animal in the report',
      'UK123456301551',
      ['UK123456301551'],
      'alreadyReported'
    ]
  ])(
    'it refuses an ear tag number that %s',
    (_description, earTagNumber, reportedEarTags, code) => {
      // Arrange
      const answers = { ...validAnswers, earTagNumber }

      // Act
      const { errors } = validate(answers, reportedEarTags)

      // Assert
      expect(errors).toEqual([{ field: 'earTagNumber', code }])
    }
  )

  test('it asks for both answers when neither is given', () => {
    // Arrange
    const answers = { earTagNumber: ' ', dateOfDeath: '' }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([
      { field: 'earTagNumber', code: 'required' },
      { field: 'dateOfDeath', code: 'required' }
    ])
  })

  test.each([
    ['6/11/2026', 'future'],
    ['30/2/2026', 'invalid']
  ])('it refuses a date of death of %j', (dateOfDeath, code) => {
    // Arrange
    const answers = { ...validAnswers, dateOfDeath }

    // Act
    const { errors } = validate(answers)

    // Assert
    expect(errors).toEqual([{ field: 'dateOfDeath', code }])
  })

  test('it holds a registered animal back until its details are saved', () => {
    // Arrange
    const death = { isRegistered: 'yes' }

    // Act
    const page = deathReport.firstUnansweredPage(death)

    // Assert
    expect(page).toBe('registered-animal-details')
  })
})
