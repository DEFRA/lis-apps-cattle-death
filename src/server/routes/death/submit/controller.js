import * as submissionClient from '#server/services/be4fe/submission.js'
import { CONFIRMATION_PAGE } from '../confirmation/view-model.js'
import { submissionPagePath, submissionPath } from '../paths.js'
import { reportOf } from '../report-key.js'
import { listAnimals } from '../tag-list/controller.js'
import { buildViewModel } from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */

const TEMPLATE = 'death/submit/index'

/**
 * A death report is sent once, and only when every animal in it is ready.
 * @param {Request} request
 * @returns {Promise<string | undefined>} the path to go to instead of
 *   sending: the confirmation of a report already sent, or the list of
 *   animals of one with no animal or an unfinished one; undefined for a
 *   report ready to send
 */
async function pathInsteadOfSending(request) {
  const { cph, submissionId } = request.params
  const report = reportOf(request)
  const { status } = await submissionClient.getSubmission(report)

  if (status === submissionClient.SUBMITTED_STATUS) {
    return submissionPagePath(cph, submissionId, CONFIRMATION_PAGE)
  }

  const animals = await listAnimals(report)

  return animals.length && animals.every((animal) => animal.isReady)
    ? undefined
    : submissionPath(cph, submissionId)
}

export const submitReportController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const elsewhere = await pathInsteadOfSending(request)

    return elsewhere
      ? h.redirect(elsewhere)
      : h.view(TEMPLATE, buildViewModel({ request }))
  }
}

export const submitReportSubmitController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const { cph, submissionId } = request.params
    const elsewhere = await pathInsteadOfSending(request)

    if (elsewhere) {
      return h.redirect(elsewhere)
    }

    // A failure to send is the service's problem page; the report is kept
    // as it was, to send again.
    await submissionClient.submitReport(reportOf(request))

    return h.redirect(submissionPagePath(cph, submissionId, CONFIRMATION_PAGE))
  }
}
