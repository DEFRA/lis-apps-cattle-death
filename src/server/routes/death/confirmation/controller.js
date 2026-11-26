import Boom from '@hapi/boom'

import * as submissionClient from '#server/services/be4fe/submission.js'
import { holdingHomePath } from '../paths.js'
import { reportOf } from '../report-key.js'
import { buildViewModel } from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */

const TEMPLATE = 'death/confirmation/index'
const NOT_FOUND = 404

/**
 * @param {Request} request
 * @returns {Promise<number | undefined>} how many animals the report sent;
 *   undefined for one that has not been sent, or that there is not
 */
async function sentAnimalCount(request) {
  try {
    const { status, animals } = await submissionClient.getSubmission(
      reportOf(request)
    )

    return status === submissionClient.SUBMITTED_STATUS
      ? animals.length
      : undefined
  } catch (error) {
    if (Boom.isBoom(error, NOT_FOUND)) {
      return undefined
    }

    throw error
  }
}

export const confirmationController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const animalCount = await sentAnimalCount(request)

    // Nothing sent is nothing to confirm: on to the holding's cattle
    return animalCount === undefined
      ? h.redirect(`${holdingHomePath(request.params.cph)}/animals`)
      : h.view(TEMPLATE, buildViewModel({ request, animalCount }))
  }
}
