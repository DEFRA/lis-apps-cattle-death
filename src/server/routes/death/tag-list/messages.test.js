import { getMessage, MAX_ANIMALS } from './messages.js'

describe('getMessage()', () => {
  test.each([
    [
      'addAnother',
      'required',
      'Select yes to report more deaths, or no to continue'
    ],
    ['addAnother', 'noAnimals', 'Add at least one animal before continuing'],
    [
      'addAnother',
      'tooMany',
      'You can add up to 50 animals to one report. Select no to continue'
    ],
    [
      'animals',
      'incomplete',
      'Complete all required animal details before continuing'
    ]
  ])('gives the text for %s %s', (field, code, expected) => {
    // Arrange
    const result = { field, code }

    // Act
    const text = getMessage(result)

    // Assert
    expect(text).toBe(expected)
  })

  test('allows 50 animals in a report, the CTS batch ceiling', () => {
    // Arrange
    // Act
    // Assert
    expect(MAX_ANIMALS).toBe(50)
  })

  test.each([
    ['an unknown code', { field: 'addAnother', code: 'future' }],
    ['an unknown field', { field: 'dam', code: 'required' }],
    ['an inherited property name', { field: 'animals', code: 'toString' }]
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
