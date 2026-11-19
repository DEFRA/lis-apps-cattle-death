import { isRegisteredSchema } from './is-registered.js'

describe('isRegisteredSchema', () => {
  test.each(['yes', 'no', ' yes '])('it takes %j', (isRegistered) => {
    // Arrange
    const answers = { isRegistered }

    // Act
    const { error, value } = isRegisteredSchema.validate(answers)

    // Assert
    expect(error).toBeUndefined()
    expect(value.isRegistered).toBe(isRegistered.trim())
  })

  test.each([
    ['blank', ''],
    ['only spaces', '   '],
    ['not yes or no', 'maybe'],
    ['missing', undefined]
  ])('it gives %s as required', (_description, isRegistered) => {
    // Arrange
    const answers = { isRegistered }

    // Act
    const { error } = isRegisteredSchema.validate(answers)

    // Assert
    expect(error.details).toEqual([
      expect.objectContaining({ path: ['isRegistered'], message: 'required' })
    ])
  })
})
