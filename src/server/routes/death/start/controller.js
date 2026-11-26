import * as submissionClient from '#server/services/be4fe/submission.js'
import { animalPagePath, newAnimalPath } from '../paths.js'
import { holdingOf } from '../report-key.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */

const FIRST_PAGE = 'is-registered'

export const startReportController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const { cph } = request.params
    const { submissionId, animalId } = await submissionClient.startReport(
      holdingOf(request)
    )

    return h.redirect(
      animalId
        ? animalPagePath(cph, submissionId, animalId, FIRST_PAGE)
        : newAnimalPath(cph, submissionId, FIRST_PAGE)
    )
  }
}
