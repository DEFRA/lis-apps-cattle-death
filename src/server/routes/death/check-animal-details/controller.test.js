import Boom from '@hapi/boom'

import * as animalClient from '#server/services/be4fe/animal.js'
import * as dataClient from '#server/services/be4fe/data.js'
import * as submissionClient from '#server/services/be4fe/submission.js'
import {
  checkAnimalDetailsController,
  checkAnimalDetailsSubmitController
} from './controller.js'

vi.mock('#server/services/be4fe/animal.js')
vi.mock('#server/services/be4fe/data.js')
vi.mock('#server/services/be4fe/submission.js')

const TEMPLATE = 'death/check-animal-details/index'
const PARAMS = {
  cph: '10/081/1234',
  submissionId: '7ZK-M3Q-A9D',
  animalId: 'UK123456301550'
}
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const ANIMAL_PATH = `${REPORT_PATH}/animals/UK123456301550`
const request = {
  params: PARAMS,
  query: {},
  auth: { credentials: { user: { sub: 'keeper-1' } } }
}
const complete = {
  isRegistered: 'yes',
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  getHoldingCattle: vi.mocked(dataClient.getHoldingCattle),
  getUnusedEarTags: vi.mocked(dataClient.getUnusedEarTags),
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

/**
 * @returns {object} a response toolkit
 */
function toolkit() {
  return {
    view: vi.fn().mockReturnValue('viewed'),
    redirect: vi.fn().mockReturnValue('redirected')
  }
}

describe('checkAnimalDetailsController', () => {
  beforeAll(() => {
    mocks.getAnimal.mockResolvedValue(complete)
    mocks.getHoldingCattle.mockResolvedValue([
      { earTagNumber: 'UK123456301550' }
    ])
    mocks.getUnusedEarTags.mockResolvedValue([])
    mocks.getSubmission.mockResolvedValue({
      animals: [{ animalId: 'UK123456301550' }]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test('it shows an animal with every page answered', async () => {
      // Arrange
      const h = toolkit()

      // Act
      const result = await checkAnimalDetailsController.handler(request, h)

      // Assert
      expect(mocks.getAnimal).toHaveBeenCalledWith({
        ...PARAMS
      })
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({ heading: 'Check animal details' })
      )
      expect(result).toBe('viewed')
    })

    test('it sends an animal with a page unanswered to that page', async () => {
      // Arrange
      const h = toolkit()
      mocks.getAnimal.mockResolvedValueOnce({ isRegistered: 'yes' })

      // Act
      await checkAnimalDetailsController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${ANIMAL_PATH}/registered-animal-details`
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    test('it propagates not found for an animal the report does not have', async () => {
      // Arrange
      const h = toolkit()
      mocks.getAnimal.mockRejectedValueOnce(Boom.notFound())

      // Act
      let error
      try {
        await checkAnimalDetailsController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
    })
  })

  describe('POST', () => {
    test('it continues a complete animal to the list of animals', async () => {
      // Arrange
      const h = toolkit()

      // Act
      const result = await checkAnimalDetailsSubmitController.handler(
        request,
        h
      )

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(REPORT_PATH)
      expect(result).toBe('redirected')
    })

    test('it sends an animal no longer on the holding back to its page marked to return', async () => {
      // Arrange
      const h = toolkit()
      mocks.getHoldingCattle.mockResolvedValueOnce([])

      // Act
      await checkAnimalDetailsSubmitController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${ANIMAL_PATH}/registered-animal-details?return=check`
      )
    })
  })
})
