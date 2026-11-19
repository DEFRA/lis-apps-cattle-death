import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import { CONFIRMATION_PAGE } from './confirmation/view-model.js'
import { submissionPagePath } from './paths.js'
import { reportOf } from './report-key.js'

/** @import { Request, ResponseToolkit } from '@hapi/hapi' */

/**
 * A death report that has been sent is finished: none of its pages but its
 * confirmation opens, so Back after sending cannot change or add to what
 * will never be sent again.
 * @param {Request} request
 * @param {ResponseToolkit} h
 * @returns {Promise<symbol | object>} h.continue for a report not yet sent,
 *   otherwise a redirect to its confirmation, taking over the response
 * @throws {Error} not found, for a report the keeper does not have
 */
export async function demandUnsentReport(request, h) {
  const { cph, submissionId } = request.params
  const { status } = await submissionClient.getSubmission(reportOf(request))

  if (status !== submissionClient.SUBMITTED_STATUS) {
    return h.continue
  }

  return h
    .redirect(submissionPagePath(cph, submissionId, CONFIRMATION_PAGE))
    .takeover()
}
