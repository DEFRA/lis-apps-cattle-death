import Boom from '@hapi/boom'

import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import {
  isRegisteredController,
  isRegisteredSubmitController
} from './controller.js'

vi.mock('#server/services/temporary-be4fe/animal.js')
vi.mock('#server/services/temporary-be4fe/submission.js')

const TEMPLATE = 'death/is-registered/index'
const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const SAVED_ANIMAL = { ...NEW_ANIMAL, animalId: 'UK123456301550' }
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const ANIMAL_PATH = `${REPORT_PATH}/animals/UK123456301550`
const auth = { credentials: { user: { sub: 'keeper-1' } } }
const registered = {
  isRegistered: 'yes',
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  saveAnimal: vi.mocked(animalClient.saveAnimal),
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

describe('isRegisteredController', () => {
  beforeAll(() => {
    mocks.getAnimal.mockResolvedValue(registered)
    mocks.getSubmission.mockResolvedValue({ animals: [] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test("it shows a saved animal's answer, without asking for the report", async () => {
      // Arrange
      const { h } = toolkit()

      // Act
      await isRegisteredController.handler(requestFor(SAVED_ANIMAL), h)

      // Assert
      expect(mocks.getAnimal).toHaveBeenCalledWith({
        ...SAVED_ANIMAL,
        userId: 'keeper-1'
      })
      expect(mocks.getSubmission).not.toHaveBeenCalled()
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: { isRegistered: 'yes' },
          backLinkHref: REPORT_PATH
        })
      )
    })

    test('it starts the report from the holding for a new animal in a report with none', async () => {
      // Arrange
      const { h } = toolkit()

      // Act
      await isRegisteredController.handler(requestFor(NEW_ANIMAL), h)

      // Assert
      expect(mocks.getAnimal).not.toHaveBeenCalled()
      expect(mocks.getSubmission).toHaveBeenCalledWith({
        ...NEW_ANIMAL,
        userId: 'keeper-1'
      })
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          values: { isRegistered: '' },
          backLinkHref: '/holdings/10/081/1234/cattle'
        })
      )
    })

    test('it goes back to the list of animals for a new animal in a report with some', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({
        animals: [{ animalId: 'UK123456301551' }]
      })

      // Act
      await isRegisteredController.handler(requestFor(NEW_ANIMAL), h)

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({ backLinkHref: REPORT_PATH })
      )
    })

    test('it propagates not found for an animal the report does not have', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.getAnimal.mockRejectedValueOnce(Boom.notFound())

      // Act
      let error
      try {
        await isRegisteredController.handler(requestFor(SAVED_ANIMAL), h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    test.each([
      ['yes', 'registered-animal-details'],
      ['no', 'unregistered-animal-details']
    ])(
      'it sends a new animal answered %s to its details page, saving nothing',
      async (isRegistered, page) => {
        // Arrange
        const { h } = toolkit()
        const request = requestFor(NEW_ANIMAL, { payload: { isRegistered } })

        // Act
        const result = await isRegisteredSubmitController.handler(request, h)

        // Assert
        expect(h.redirect).toHaveBeenCalledWith(
          `${REPORT_PATH}/animals/${page}`
        )
        expect(mocks.saveAnimal).not.toHaveBeenCalled()
        expect(result).toBe('redirected')
      }
    )

    test("it sends a saved animal to its branch's details page", async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(SAVED_ANIMAL, {
        payload: { isRegistered: 'yes' }
      })

      // Act
      await isRegisteredSubmitController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${ANIMAL_PATH}/registered-animal-details`
      )
    })

    test('it goes back to check animal details after a Change link that keeps the answer', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(SAVED_ANIMAL, {
        payload: { isRegistered: 'yes' },
        query: { return: 'check' }
      })

      // Act
      await isRegisteredSubmitController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${ANIMAL_PATH}/check-animal-details`
      )
      expect(mocks.saveAnimal).not.toHaveBeenCalled()
    })

    test('it goes through the other branch, still marked, after a Change link that changes the answer', async () => {
      // Arrange
      const { h } = toolkit()
      const request = requestFor(SAVED_ANIMAL, {
        payload: { isRegistered: 'no' },
        query: { return: 'check' }
      })

      // Act
      await isRegisteredSubmitController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${ANIMAL_PATH}/unregistered-animal-details?return=check`
      )
      expect(mocks.saveAnimal).not.toHaveBeenCalled()
    })

    test('it shows the page again with its error, as a bad request, when nothing is selected', async () => {
      // Arrange
      const { h, response } = toolkit()
      const request = requestFor(NEW_ANIMAL, { payload: { isRegistered: '' } })

      // Act
      await isRegisteredSubmitController.handler(request, h)

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          errorList: [
            {
              text: 'Select if the animal is registered on your holding or not to continue',
              href: '#isRegistered'
            }
          ]
        })
      )
      expect(response.code).toHaveBeenCalledWith(400)
      expect(h.redirect).not.toHaveBeenCalled()
    })
  })
})
