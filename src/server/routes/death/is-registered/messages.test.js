import { getMessage } from './messages.js'

describe('getMessage()', () => {
  test('gives the text for isRegistered required', () => {
    // Arrange
    const result = { field: 'isRegistered', code: 'required' }

    // Act
    const text = getMessage(result)

    // Assert
    expect(text).toBe(
      'Select if the animal is already registered to your holding'
    )
  })

  test.each([
    ['an unknown code', { field: 'isRegistered', code: 'future' }],
    ['an unknown field', { field: 'dam', code: 'required' }],
    ['an inherited property name', { field: 'isRegistered', code: 'toString' }]
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
