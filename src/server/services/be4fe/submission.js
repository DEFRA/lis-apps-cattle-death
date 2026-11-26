/*
 * A holding's death report (its "submission"), as the cattle-death BE4FE
 * holds it.
 */
import { SUBMITTED_STATUS } from '@defra/lis-hubs-infra-core'

import { submissions } from '#server/services/be4fe/client.js'

/** @import Boom from '@hapi/boom' */
/** @import { ReportKey } from './client.js' */

export { SUBMITTED_STATUS }

/**
 * Starts the holding's death report, or continues the one not yet
 * submitted.
 * @param {{ cph: string }} holding
 * @returns {Promise<{ submissionId: string, animalId?: string }>} the report
 *   and its first animal, to continue with; a report with no animal yet has
 *   no animalId
 */
export async function startReport({ cph }) {
  const { submissionId, animals } = await submissions.startSubmission({ cph })

  return { submissionId, animalId: animals[0]?.animalId }
}

/**
 * @param {ReportKey} key
 * @returns {Promise<{ submissionId: string, status: string, animals: { animalId: string, earTagNumber: string }[] }>}
 *   the report and its animals, in the order they were last saved; an
 *   animal's ear tag number is its id
 * @throws {Boom.Boom} not found, for a report the BE4FE does not hold under
 *   the holding
 */
export async function getSubmission({ cph, submissionId }) {
  const submission = await submissions.getSubmission({ cph, submissionId })

  return {
    submissionId: submission.submissionId,
    status: submission.status,
    animals: submission.animals.map(({ animalId }) => ({
      animalId,
      earTagNumber: animalId
    }))
  }
}

/**
 * Sends the report: the BE4FE keeps it unsent if it cannot.
 * @param {ReportKey} key
 * @returns {Promise<void>}
 * @throws {Boom.Boom} not found, for a report the BE4FE does not hold under
 *   the holding
 */
export async function submitReport({ cph, submissionId }) {
  await submissions.submit({ cph, submissionId })
}
