import Boom from '@hapi/boom'

import * as animalClient from '#server/services/be4fe/animal.js'
import * as dataClient from '#server/services/be4fe/data.js'
import * as submissionClient from '#server/services/be4fe/submission.js'
import {
  registeredAnimalDetailsController,
  registeredAnimalDetailsSubmitController
} from './controller.js'

vi.mock('#server/services/be4fe/animal.js')
vi.mock('#server/services/be4fe/data.js')
vi.mock('#server/services/be4fe/submission.js')

const TEMPLATE = 'death/registered-animal-details/index'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456301550' }
const KEY = NEW_ANIMAL
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const auth = { credentials: { user: { sub: 'keeper-1' } } }
const today = new Date()
const TODAY = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
const validAnswers = { earTagNumber: 'UK123456301551', dateOfDeath: TODAY }
const holdingCattle = [
  { earTagNumber: 'UK123456301550' },
  { earTagNumber: 'UK123456301551' },
  { earTagNumber: 'UK123456301552' }
]

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  saveAnimal: vi.mocked(animalClient.saveAnimal),
  getHoldingCattle: vi.mocked(dataClient.getHoldingCattle),
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

describe('registeredAnimalDetailsController', () => {
  beforeAll(() => {
    mocks.getAnimal.mockResolvedValue({
      isRegistered: 'yes',
      earTagNumber: 'UK123456301550',
      dateOfDeath: '1/11/2026'
    })
    mocks.getHoldingCattle.mockResolvedValue(holdingCattle)
    mocks.getSubmission.mockResolvedValue({
      animals: [{ animalId: 'UK123456301550' }, { animalId: 'UK123456301552' }]
    })
    mocks.saveAnimal.mockResolvedValue({ animalId: 'UK123456301551' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test("it shows a saved animal's answers, suggesting the holding's living cattle not in the report but its own", async () => {
      // Arrange
      const { h } = toolkit()

      // Act
      await registeredAnimalDetailsController.handler(
        requestFor(SAVED_ANIMAL),
        h
      )

      // Assert
      expect(mocks.getHoldingCattle).toHaveBeenCalledWith({
        cph: '10/081/1234'
      })
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: { earTagNumber: 'UK123456301550', dateOfDeath: '1/11/2026' },
          earTagItems: ['UK123456301550', 'UK123456301551']
        })
      )
    })

    test('it shows an unregistered animal coming here with only its date of death', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getAnimal.mockResolvedValueOnce({
        isRegistered: 'no',
        earTagNumber: 'UK123456401560',
        dateOfBirth: '1/10/2026',
        dateOfDeath: '1/11/2026'
      })

      // Act
      await registeredAnimalDetailsController.handler(
        requestFor({ ...NEW_ANIMAL, animalId: 'UK123456401560' }),
        h
      )

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: { earTagNumber: '', dateOfDeath: '1/11/2026' }
        })
      )
    })

    test('it shows a new animal with no answers', async () => {
      // Arrange
      const { h } = toolkit()

      // Act
      await registeredAnimalDetailsController.handler(requestFor(NEW_ANIMAL), h)

      // Assert
      expect(mocks.getAnimal).not.toHaveBeenCalled()
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: { earTagNumber: '', dateOfDeath: '' }
        })
      )
    })

    test('it shows no new animal once the report has 50, returning to the list of animals', async () => {
      // Arrange
      const { h } = toolkit()
      const full = {
        animals: Array.from({ length: 50 }, (_, index) => ({
          animalId: `UK1234564${String(index).padStart(5, '0')}`
        }))
      }
      // Asked once for the ear tags already reported, once for the room left
      mocks.getSubmission.mockResolvedValueOnce(full)
      mocks.getSubmission.mockResolvedValueOnce(full)

      // Act
      await registeredAnimalDetailsController.handler(requestFor(NEW_ANIMAL), h)

      // Assert
      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(REPORT_PATH)
    })

    test('it propagates not found for an animal the report does not have', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getAnimal.mockRejectedValueOnce(Boom.notFound())

      // Act
      let error
      try {
        await registeredAnimalDetailsController.handler(
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
    test('it saves a new animal as registered and continues to its check animal details', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(NEW_ANIMAL, { payload: validAnswers })

      // Act
      const result = await registeredAnimalDetailsSubmitController.handler(
        request,
        h
      )

      // Assert
      expect(mocks.saveAnimal).toHaveBeenCalledWith({
        ...KEY,
        animalId: undefined,
        values: { isRegistered: 'yes', ...validAnswers }
      })
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/UK123456301551/check-animal-details`
      )
      expect(result).toBe('redirected')
    })

    test('it saves a changed ear tag number under its old id and follows the new one', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(SAVED_ANIMAL, {
        payload: validAnswers,
        query: { return: 'check' }
      })

      // Act
      await registeredAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(mocks.saveAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ animalId: 'UK123456301550' })
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/UK123456301551/check-animal-details`
      )
    })

    test.each([
      [
        'not one of the holding',
        'UK999999999999',
        'This animal does not appear to be registered to your holding. If you believe this is incorrect, contact BCMS'
      ],
      [
        'another animal in the report',
        'UK123456301552',
        'This animal ear tag number has already been added to this report'
      ]
    ])(
      'it refuses, as a bad request, an animal %s',
      async (_description, earTagNumber, text) => {
        // Arrange
        const { h, response } = toolkit()
        const request = requestFor(SAVED_ANIMAL, {
          payload: { ...validAnswers, earTagNumber }
        })

        // Act
        await registeredAnimalDetailsSubmitController.handler(request, h)

        // Assert
        expect(h.view).toHaveBeenCalledWith(
          TEMPLATE,
          expect.objectContaining({
            values: { ...validAnswers, earTagNumber },
            errorList: [{ text, href: '#earTagNumber' }]
          })
        )
        expect(response.code).toHaveBeenCalledWith(400)
        expect(mocks.saveAnimal).not.toHaveBeenCalled()
      }
    )

    test('it asks for every answer left blank', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(NEW_ANIMAL, {
        payload: { earTagNumber: '', dateOfDeath: '' }
      })

      // Act
      await registeredAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          errorList: [
            {
              text: 'Enter all or part of the animal ear tag number you are reporting',
              href: '#earTagNumber'
            },
            { text: 'Enter the date the animal died', href: '#dateOfDeath' }
          ]
        })
      )
    })

    test('it rethrows the conflict of saving to a report already sent', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.saveAnimal.mockRejectedValueOnce(
        Boom.conflict('The death report has been sent')
      )
      const request = requestFor(NEW_ANIMAL, { payload: validAnswers })

      // Act
      let error
      try {
        await registeredAnimalDetailsSubmitController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(409)
      expect(h.redirect).not.toHaveBeenCalled()
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
        await registeredAnimalDetailsSubmitController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBe(failure)
      expect(h.redirect).not.toHaveBeenCalled()
    })
  })
})
