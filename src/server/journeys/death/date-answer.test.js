import { parsedDate, pastDate } from './date-answer.js'

const NOW = new Date('2026-11-05T10:00:00Z')

describe('date-answer', () => {
  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('parsedDate()', () => {
    test.each([
      ['1/11/2026', '2026-11-01'],
      ['01/02/2026', '2026-02-01'],
      ['31/3/2026', '2026-03-31']
    ])('it reads %j', (value, expected) => {
      // Arrange
      // Act
      const date = parsedDate(value)

      // Assert
      expect(date.toISOString().slice(0, 10)).toBe(expected)
    })

    test.each(['31/2/2026', '1/11/26', '1/11', 'yesterday', '1-11-2026'])(
      'it gives %j as not a date',
      (value) => {
        // Arrange
        // Act
        const date = parsedDate(value)

        // Assert
        expect(date).toBeUndefined()
      }
    )
  })

  describe('pastDate()', () => {
    test.each(['5/11/2026', '4/11/2026', '1/1/2020'])(
      'it takes %j, today or before',
      (value) => {
        // Arrange
        const schema = pastDate()

        // Act
        const { error, value: taken } = schema.validate(value)

        // Assert
        expect(error).toBeUndefined()
        expect(taken).toBe(value)
      }
    )

    test.each([
      ['a date after today', '6/11/2026', 'future'],
      ['a date that does not exist', '31/2/2026', 'invalid'],
      ['a two digit year', '1/11/26', 'invalid']
    ])('it refuses %s', (_description, value, code) => {
      // Arrange
      const schema = pastDate()

      // Act
      const { error } = schema.validate(value)

      // Assert
      expect(error.details[0].message).toBe(code)
    })

    test.each(['', '   '])('it takes %j as not given', (value) => {
      // Arrange
      const schema = pastDate()

      // Act
      const { error } = schema.validate(value)

      // Assert
      expect(error.details[0].type).toBe('any.required')
    })
  })
})
