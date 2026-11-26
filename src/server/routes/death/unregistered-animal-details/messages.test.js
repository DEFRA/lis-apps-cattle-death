import { getMessage } from './messages.js'

const BREED =
  'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'

describe('getMessage()', () => {
  test.each([
    [
      'earTagNumber',
      'required',
      'Enter the animal ear tag number you are reporting'
    ],
    [
      'earTagNumber',
      'notAvailable',
      'Enter the animal ear tag number you are reporting'
    ],
    [
      'earTagNumber',
      'alreadyReported',
      'This animal ear tag number has already been added to this report'
    ],
    ['dateOfBirth', 'required', 'Enter the date the animal was born'],
    [
      'dateOfBirth',
      'invalid',
      'Date of birth must be a real date, for example 01/05/2026'
    ],
    ['dateOfBirth', 'future', 'Date of birth must be in the past'],
    ['dateOfDeath', 'required', 'Enter the date the animal died'],
    [
      'dateOfDeath',
      'invalid',
      'Date of death must be a real date, for example 01/05/2026'
    ],
    ['dateOfDeath', 'future', 'Date of death needs to be in the past'],
    [
      'dateOfDeath',
      'beforeBirth',
      'Date of death cannot be before the date of birth'
    ],
    ['sex', 'required', 'Select if the animal is male or female'],
    ['breed', 'required', BREED],
    ['breed', 'unknown', BREED]
  ])('gives the text for %s %s', (field, code, expected) => {
    // Arrange
    const result = { field, code }

    // Act
    const text = getMessage(result)

    // Assert
    expect(text).toBe(expected)
  })

  test.each([
    ['an unknown code', { field: 'sex', code: 'future' }],
    ['an unknown field', { field: 'dam', code: 'required' }],
    ['an inherited property name', { field: 'breed', code: 'toString' }]
  ])('throws for %s', (_description, result) => {
    // Arrange
    let error

    // Act
    try {
      getMessage(result)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(`No message for ${result.field} ${result.code}`)
  })
})
