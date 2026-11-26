import * as animalClient from '#server/services/be4fe/animal.js'
import * as submissionClient from '#server/services/be4fe/submission.js'
import {
  animalsBeforeNew,
  answersOf,
  asBranch,
  isFull,
  reportedEarTagsOf
} from './animal-answers.js'

vi.mock('#server/services/be4fe/animal.js')
vi.mock('#server/services/be4fe/submission.js')

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

const REPORT = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const auth = { credentials: { user: { sub: 'keeper-1' } } }

describe('animal-answers', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('answersOf()', () => {
    test('it gives none for a new animal, asking for nothing', async () => {
      // Arrange
      const request = { params: REPORT, auth }

      // Act
      const death = await answersOf(request)

      // Assert
      expect(death).toEqual({})
      expect(mocks.getAnimal).not.toHaveBeenCalled()
    })

    test("it gives a saved animal's answers", async () => {
      // Arrange
      const request = {
        params: { ...REPORT, animalId: 'UK123456301550' },
        auth
      }
      mocks.getAnimal.mockResolvedValueOnce({ isRegistered: 'yes' })

      // Act
      const death = await answersOf(request)

      // Assert
      expect(death).toEqual({ isRegistered: 'yes' })
      expect(mocks.getAnimal).toHaveBeenCalledWith({
        ...REPORT,
        animalId: 'UK123456301550'
      })
    })
  })

  describe('asBranch()', () => {
    test("it clears the other branch's details", () => {
      // Arrange
      const death = {
        isRegistered: 'yes',
        earTagNumber: 'UK123456301550',
        dateOfDeath: '1/11/2026'
      }

      // Act
      const animal = asBranch(death, 'no')

      // Assert
      expect(animal).toEqual({ isRegistered: 'no', dateOfDeath: '1/11/2026' })
    })
  })

  describe('reportedEarTagsOf()', () => {
    test("it lists the report's other animals", async () => {
      // Arrange
      const request = {
        params: { ...REPORT, animalId: 'uk123456301550' },
        auth
      }
      mocks.getSubmission.mockResolvedValueOnce({
        animals: [
          { animalId: 'UK123456301550' },
          { animalId: 'UK123456301551' }
        ]
      })

      // Act
      const earTags = await reportedEarTagsOf(request)

      // Assert
      expect(earTags).toEqual(['UK123456301551'])
      expect(mocks.getSubmission).toHaveBeenCalledWith({
        ...REPORT
      })
    })

    test('it lists every animal for a new one', async () => {
      // Arrange
      const request = { params: REPORT, auth }
      mocks.getSubmission.mockResolvedValueOnce({
        animals: [{ animalId: 'UK123456301550' }]
      })

      // Act
      const earTags = await reportedEarTagsOf(request)

      // Assert
      expect(earTags).toEqual(['UK123456301550'])
    })
  })

  describe('animalsBeforeNew()', () => {
    test('it counts the report animals for a new one', async () => {
      // Arrange
      const request = { params: REPORT, auth }
      mocks.getSubmission.mockResolvedValueOnce({
        animals: [{ animalId: 'UK123456301550' }]
      })

      // Act
      const count = await animalsBeforeNew(request)

      // Assert
      expect(count).toBe(1)
    })

    test('it asks nothing for a saved animal', async () => {
      // Arrange
      const request = {
        params: { ...REPORT, animalId: 'UK123456301550' },
        auth
      }

      // Act
      const count = await animalsBeforeNew(request)

      // Assert
      expect(count).toBeUndefined()
      expect(mocks.getSubmission).not.toHaveBeenCalled()
    })
  })

  describe('isFull()', () => {
    test.each([
      [undefined, false],
      [49, false],
      [50, true]
    ])('it gives %j animals before as %j', (animalsBefore, expected) => {
      // Arrange
      // Act
      const result = isFull(animalsBefore)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
