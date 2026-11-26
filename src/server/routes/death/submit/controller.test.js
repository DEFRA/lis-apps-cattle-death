import Boom from '@hapi/boom'

import * as submissionClient from '#server/services/be4fe/submission.js'
import { listAnimals } from '../tag-list/controller.js'
import {
  submitReportController,
  submitReportSubmitController
} from './controller.js'

vi.mock('#server/services/be4fe/submission.js')
vi.mock('../tag-list/controller.js')

const PARAMS = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const REPORT = PARAMS
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const request = {
  params: PARAMS,
  auth: { credentials: { user: { sub: 'keeper-1' } } }
}
const READY = { animalId: 'UK123456301550', isReady: true }
const UNFINISHED = { animalId: 'UK123456401560', isReady: false }

const mocks = {
  getSubmission: vi.mocked(submissionClient.getSubmission),
  submitReport: vi.mocked(submissionClient.submitReport),
  listAnimals: vi.mocked(listAnimals)
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

describe('submitReportController', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test('it shows the declaration for a report whose animals are all ready', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })
      mocks.listAnimals.mockResolvedValueOnce([READY])

      // Act
      const result = await submitReportController.handler(request, h)

      // Assert
      expect(mocks.getSubmission).toHaveBeenCalledWith(REPORT)
      expect(mocks.listAnimals).toHaveBeenCalledWith(REPORT)
      expect(h.view).toHaveBeenCalledWith(
        'death/submit/index',
        expect.objectContaining({ formAction: `${REPORT_PATH}/submit` })
      )
      expect(result).toBe('viewed')
    })

    test.each([
      ['while an animal is unfinished', [READY, UNFINISHED]],
      ['for a report with no animal', []]
    ])(
      'it returns to the list of animals %s',
      async (_description, animals) => {
        // Arrange
        const h = toolkit()
        mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })
        mocks.listAnimals.mockResolvedValueOnce(animals)

        // Act
        await submitReportController.handler(request, h)

        // Assert
        expect(h.redirect).toHaveBeenCalledWith(REPORT_PATH)
        expect(h.view).not.toHaveBeenCalled()
      }
    )

    test('it continues to the confirmation of a report already sent, without judging its animals', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({ status: 'SUBMITTED' })

      // Act
      await submitReportController.handler(request, h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(`${REPORT_PATH}/confirmation`)
      expect(mocks.listAnimals).not.toHaveBeenCalled()
    })

    test('it propagates not found for a report the keeper does not have', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockRejectedValueOnce(Boom.notFound())

      // Act
      let error
      try {
        await submitReportController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error.output.statusCode).toBe(404)
      expect(h.view).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    test('it sends the report and continues to its confirmation', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })
      mocks.listAnimals.mockResolvedValueOnce([READY])

      // Act
      const result = await submitReportSubmitController.handler(request, h)

      // Assert
      expect(mocks.submitReport).toHaveBeenCalledWith(REPORT)
      expect(h.redirect).toHaveBeenCalledWith(`${REPORT_PATH}/confirmation`)
      expect(result).toBe('redirected')
    })

    test('it sends nothing while an animal is unfinished, returning to the list of animals', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })
      mocks.listAnimals.mockResolvedValueOnce([UNFINISHED])

      // Act
      await submitReportSubmitController.handler(request, h)

      // Assert
      expect(mocks.submitReport).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(REPORT_PATH)
    })

    test('it does not send a report twice, continuing to its confirmation', async () => {
      // Arrange
      const h = toolkit()
      mocks.getSubmission.mockResolvedValueOnce({ status: 'SUBMITTED' })

      // Act
      await submitReportSubmitController.handler(request, h)

      // Assert
      expect(mocks.submitReport).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(`${REPORT_PATH}/confirmation`)
    })

    test('it rethrows a failure to send, as the problem page, redirecting nowhere', async () => {
      // Arrange
      const h = toolkit()
      const failure = Boom.serverUnavailable(
        'The death report could not be sent'
      )
      mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })
      mocks.listAnimals.mockResolvedValueOnce([READY])
      mocks.submitReport.mockRejectedValueOnce(failure)

      // Act
      let error
      try {
        await submitReportSubmitController.handler(request, h)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBe(failure)
      expect(error.output.statusCode).toBe(503)
      expect(h.redirect).not.toHaveBeenCalled()
    })
  })
})
