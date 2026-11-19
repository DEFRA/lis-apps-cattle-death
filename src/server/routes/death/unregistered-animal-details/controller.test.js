import Boom from '@hapi/boom'

import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import * as dataClient from '#server/services/temporary-be4fe/data.js'
import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import {
  unregisteredAnimalDetailsController,
  unregisteredAnimalDetailsSubmitController
} from './controller.js'

vi.mock('#server/services/temporary-be4fe/animal.js')
vi.mock('#server/services/temporary-be4fe/data.js')
vi.mock('#server/services/temporary-be4fe/submission.js')

const TEMPLATE = 'death/unregistered-animal-details/index'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456401560' }
const KEY = { ...NEW_ANIMAL, userId: 'keeper-1' }
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const auth = { credentials: { user: { sub: 'keeper-1' } } }
const today = new Date()
const TODAY = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
const validAnswers = {
  earTagNumber: 'UK123456401561',
  dateOfBirth: TODAY,
  dateOfDeath: TODAY,
  sex: 'male',
  breed: 'HE'
}
const saved = {
  isRegistered: 'no',
  earTagNumber: 'UK123456401560',
  dateOfBirth: '1/10/2026',
  dateOfDeath: '1/11/2026',
  sex: 'female',
  breed: 'AA'
}

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  saveAnimal: vi.mocked(animalClient.saveAnimal),
  getUnusedEarTags: vi.mocked(dataClient.getUnusedEarTags),
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

/**
 * @param {object} params
 * @param {object} [extra] - the payload or query
 * @returns {object} a request for the page
 */
function requestFor(params, extra = {}) {
  return { params, query: {}, auth, ...extra }
}

/**
 * @returns {{ h: object, response: object }} a response toolkit whose view
 *   responses record the status code set on them
 */
function toolkit() {
  const response = { code: vi.fn() }
  response.code.mockReturnValue(response)
  const h = {
    view: vi.fn().mockReturnValue(response),
    redirect: vi.fn().mockReturnValue('redirected')
  }
  return { h, response }
}

describe('unregisteredAnimalDetailsController', () => {
  beforeAll(() => {
    mocks.getAnimal.mockResolvedValue(saved)
    mocks.getUnusedEarTags.mockResolvedValue([
      'UK123456401561',
      'UK123456401562'
    ])
    mocks.saveAnimal.mockResolvedValue({ animalId: 'UK123456401561' })
    mocks.getSubmission.mockResolvedValue({ animals: [] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test("it shows a saved animal's answers, suggesting its own ear tag and the holding's unused ones", async () => {
      // Arrange
      const { h } = toolkit()

      // Act
      await unregisteredAnimalDetailsController.handler(
        requestFor(SAVED_ANIMAL),
        h
      )

      // Assert
      expect(mocks.getUnusedEarTags).toHaveBeenCalledWith(KEY)
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: {
            earTagNumber: 'UK123456401560',
            dateOfBirth: '1/10/2026',
            dateOfDeath: '1/11/2026',
            sex: 'female',
            breed: 'AA'
          },
          earTagItems: ['UK123456401560', 'UK123456401561', 'UK123456401562']
        })
      )
    })

    test('it shows a registered animal coming here with only its date of death, suggesting only unused tags', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getAnimal.mockResolvedValueOnce({
        isRegistered: 'yes',
        earTagNumber: 'UK123456301550',
        dateOfDeath: '1/11/2026'
      })

      // Act
      await unregisteredAnimalDetailsController.handler(
        requestFor({ ...NEW_ANIMAL, animalId: 'UK123456301550' }),
        h
      )

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: {
            earTagNumber: '',
            dateOfBirth: '',
            dateOfDeath: '1/11/2026',
            sex: '',
            breed: ''
          },
          earTagItems: ['UK123456401561', 'UK123456401562']
        })
      )
    })

    test('it propagates not found for an animal the report does not have', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getAnimal.mockRejectedValueOnce(Boom.notFound())

      // Act
      let error
      try {
        await unregisteredAnimalDetailsController.handler(
          requestFor(SAVED_ANIMAL),
          h
        )
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    test('it saves a new animal as unregistered and continues to its check animal details', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(NEW_ANIMAL, { payload: validAnswers })

      // Act
      const result = await unregisteredAnimalDetailsSubmitController.handler(
        request,
        h
      )

      // Assert
      expect(mocks.getAnimal).not.toHaveBeenCalled()
      expect(mocks.saveAnimal).toHaveBeenCalledWith({
        ...KEY,
        animalId: undefined,
        values: { isRegistered: 'no', ...validAnswers }
      })
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/UK123456401561/check-animal-details`
      )
      expect(result).toBe('redirected')
    })

    test('it keeps the ear tag the animal already has', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.saveAnimal.mockResolvedValueOnce({ animalId: 'UK123456401560' })
      const request = requestFor(SAVED_ANIMAL, {
        payload: { ...validAnswers, earTagNumber: 'UK123456401560' }
      })

      // Act
      await unregisteredAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(mocks.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ animalId: 'UK123456401560' })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/UK123456401560/check-animal-details`
      )
    })

    test('it refuses, as a bad request, a tag that is not one of the unused ones', async () => {
      // Arrange
      const { h, response } = toolkit()
      const request = requestFor(NEW_ANIMAL, {
        payload: { ...validAnswers, earTagNumber: 'UK123456301550' }
      })

      // Act
      await unregisteredAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          errorList: [
            {
              text: 'Enter the animal ear tag number you are reporting',
              href: '#earTagNumber'
            }
          ]
        })
      )
      expect(response.code).toHaveBeenCalledWith(400)
      expect(mocks.saveAnimal).not.toHaveBeenCalled()
    })

    test('it saves no new animal once the report has 50, returning to the list of animals', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({
        animals: Array.from({ length: 50 }, (_, index) => ({
          animalId: `UK1234564${String(index).padStart(5, '0')}`
        }))
      })
      const request = requestFor(NEW_ANIMAL, { payload: validAnswers })

      // Act
      await unregisteredAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(mocks.saveAnimal).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(REPORT_PATH)
    })

    test('it rethrows a failure to save', async () => {
      // Arrange
      const { h } = toolkit()
      const failure = new Error('503 - Service unavailable')
      mocks.saveAnimal.mockRejectedValueOnce(failure)
      const request = requestFor(NEW_ANIMAL, { payload: validAnswers })

      // Act
      let error
      try {
        await unregisteredAnimalDetailsSubmitController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBe(failure)
      expect(h.redirect).not.toHaveBeenCalled()
    })
  })
})
