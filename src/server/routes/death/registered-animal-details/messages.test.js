import { getMessage } from './messages.js'

describe('getMessage()', () => {
  test.each([
    ['earTagNumber', 'required', 'Enter the animal ear tag number'],
    [
      'earTagNumber',
      'notOnHolding',
      'This animal does not appear to be registered to your holding. If you believe this is incorrect, contact BCMS'
    ],
    [
      'earTagNumber',
      'alreadyReported',
      'A death has already been reported for this animal'
    ],
    ['dateOfDeath', 'required', 'Enter the date of death'],
    [
      'dateOfDeath',
      'invalid',
      'Date of death must be a real date, for example 01/05/2026'
    ],
    ['dateOfDeath', 'future', 'The date of death cannot be in the future']
  ])('gives the text for %s %s', (field, code, expected) => {
    // Arrange
    const result = { field, code }

    // Act
    const text = getMessage(result)

    // Assert
    expect(text).toBe(expected)
  })

  test.each([
    ['an unknown code', { field: 'dateOfDeath', code: 'notOnHolding' }],
    ['an unknown field', { field: 'sex', code: 'required' }],
    ['an inherited property name', { field: 'earTagNumber', code: 'toString' }]
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
