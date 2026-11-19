/*
 * TEMPORARY, until the cattle-death backend-for-frontend (BE4FE) exists:
 * a keeper's death report for a holding (its "submission"), shaped as
 * cattle-register's BE4FE submission client so the BE4FE's client can take
 * its place.
 */
import { randomInt } from 'node:crypto'

import Boom from '@hapi/boom'

import { FAILS_TO_SEND, recordDeath } from './holdings.js'
import { DRAFT_STATUS, holdReport, reportAt, unsentReportOf } from './store.js'

/** @import { KeeperKey, ReportKey } from './store.js' */

// The status of a submission that has been sent
export const SUBMITTED_STATUS = 'SUBMITTED'

// The BE4FE's id format, as cattle-register's: three groups of three
// Crockford base32 characters
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ID_GROUPS = 3
const ID_GROUP_LENGTH = 3

/**
 * @returns {string} a new submission id, e.g. 7ZK-M3Q-A9D
 */
function newSubmissionId() {
  return Array.from({ length: ID_GROUPS }, () =>
    Array.from(
      { length: ID_GROUP_LENGTH },
      () => ID_ALPHABET[randomInt(ID_ALPHABET.length)]
    ).join('')
  ).join('-')
}

/**
 * Starts the keeper's death report for the holding, or continues the one
 * they have not submitted.
 * @param {KeeperKey} keeper
 * @returns {Promise<{ submissionId: string, animalId?: string }>} the report
 *   and its first animal, to continue with; a report with no animal yet has
 *   no animalId
 */
export async function startReport({ cph, userId }) {
  const unsent = unsentReportOf({ cph, userId })

  if (unsent) {
    return {
      submissionId: unsent.submissionId,
      animalId: unsent.animals[0]?.animalId
    }
  }

  const submissionId = newSubmissionId()
  holdReport({
    cph,
    userId,
    submissionId,
    status: DRAFT_STATUS,
    animals: []
  })

  return { submissionId }
}

/**
 * @param {ReportKey} key
 * @returns {Promise<{ submissionId: string, status: string, animals: { animalId: string, earTagNumber: string }[] }>}
 *   the report and its animals, in the order they were last saved; an
 *   animal's ear tag number is its id
 * @throws {Boom.Boom} not found, for a report the keeper does not have for
 *   the holding
 */
export async function getSubmission(key) {
  const { submissionId, status, animals } = reportAt(key)

  return {
    submissionId,
    status,
    animals: animals.map(({ animalId }) => ({
      animalId,
      earTagNumber: animalId
    }))
  }
}

/**
 * Sends the report, and keeps it unsent if it cannot. A report already sent
 * is not sent again.
 * @param {ReportKey} key
 * @returns {Promise<void>}
 * @throws {Boom.Boom} not found, for a report the keeper does not have for
 *   the holding; service unavailable, for one that could not be sent
 */
export async function submitReport(key) {
  const report = reportAt(key)

  if (report.status === SUBMITTED_STATUS) {
    return
  }

  if (report.animals.some(({ animalId }) => FAILS_TO_SEND.has(animalId))) {
    throw Boom.serverUnavailable('The death report could not be sent')
  }

  for (const { death } of report.animals) {
    recordDeath(report.cph, {
      isRegistered: death.isRegistered,
      earTagNumber: death.earTagNumber
    })
  }
  report.status = SUBMITTED_STATUS
}
