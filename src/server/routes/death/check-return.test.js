import {
  backLinkPath,
  isReturningToCheck,
  keepReturn,
  pathAfterSave,
  withReturnToCheck
} from './check-return.js'

const params = {
  cph: '10/081/1234',
  submissionId: '7ZK-M3Q-A9D',
  animalId: 'UK123456301550'
}
const ANIMAL_PATH =
  '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/animals/UK123456301550'
const fromJourney = { params, query: {} }
const fromChangeLink = { params, query: { return: 'check' } }
const registered = {
  isRegistered: 'yes',
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}

describe('check-return', () => {
  describe('isReturningToCheck()', () => {
    test.each([
      ['a Change link', fromChangeLink, true],
      ['the journey', fromJourney, false],
      ['a request with no query', { params }, false],
      [
        'another return value',
        { params, query: { return: 'https://x' } },
        false
      ]
    ])('it is %s: %s', (_description, request, expected) => {
      // Arrange
      // Act
      const result = isReturningToCheck(request)

      // Assert
      expect(result).toBe(expected)
    })
  })

  describe('withReturnToCheck()', () => {
    test('it marks the path', () => {
      // Arrange
      const path = `${ANIMAL_PATH}/is-registered`

      // Act
      const result = withReturnToCheck(path)

      // Assert
      expect(result).toBe(`${ANIMAL_PATH}/is-registered?return=check`)
    })
  })

  describe('keepReturn()', () => {
    test.each([
      ['keeps the mark from a Change link', fromChangeLink, '?return=check'],
      ['leaves the path unmarked from the journey', fromJourney, '']
    ])('it %s', (_description, request, suffix) => {
      // Arrange
      const path = `${ANIMAL_PATH}/is-registered`

      // Act
      const result = keepReturn(request, path)

      // Assert
      expect(result).toBe(`${path}${suffix}`)
    })
  })

  describe('pathAfterSave()', () => {
    test.each([
      ['yes', 'registered-animal-details'],
      ['no', 'unregistered-animal-details']
    ])(
      'it goes from is-registered answered %s to its details page',
      (isRegistered, page) => {
        // Arrange
        const death = { isRegistered }

        // Act
        const result = pathAfterSave(fromJourney, 'is-registered', death)

        // Assert
        expect(result).toBe(`${ANIMAL_PATH}/${page}`)
      }
    )

    test('it goes from the last page to check animal details', () => {
      // Arrange
      const death = registered

      // Act
      const result = pathAfterSave(
        fromJourney,
        'registered-animal-details',
        death
      )

      // Assert
      expect(result).toBe(`${ANIMAL_PATH}/check-animal-details`)
    })

    test('it goes back to check animal details after a Change link that leaves the animal complete', () => {
      // Arrange
      const death = registered

      // Act
      const result = pathAfterSave(fromChangeLink, 'is-registered', death)

      // Assert
      expect(result).toBe(`${ANIMAL_PATH}/check-animal-details`)
    })
  })

  describe('backLinkPath()', () => {
    test.each([
      [
        'check animal details after a Change link',
        fromChangeLink,
        `${ANIMAL_PATH}/check-animal-details`
      ],
      ['the previous page from the journey', fromJourney, '/previous']
    ])('it is %s', (_description, request, expected) => {
      // Arrange
      // Act
      const result = backLinkPath(request, '/previous')

      // Assert
      expect(result).toBe(expected)
    })
  })
})
