/*
 * TEMPORARY, until the cattle-death backend-for-frontend (BE4FE) exists:
 * each keeper's death reports for a holding (each a "submission") and the
 * animals in them, held in this process's memory as the BE4FE would hold
 * them. They are lost on a restart and are not shared between instances.
 */
import Boom from '@hapi/boom'

/** @import { DraftDeath } from './animal.js' */

/**
 * @typedef {object} KeeperKey - a keeper on a holding
 * @property {string} cph - the holding, as 12/345/6789
 * @property {string} userId - the keeper's user id
 */

/**
 * @typedef {object} ReportKey - one of a keeper's death reports for a holding
 * @property {string} cph - the holding, as 12/345/6789
 * @property {string} submissionId
 * @property {string} userId - the keeper's user id
 */

/**
 * @typedef {object} HeldAnimal
 * @property {string} animalId - its ear tag number in capitals with no
 *   spaces
 * @property {DraftDeath} death
 */

/**
 * @typedef {object} Report - a death report as it is held
 * @property {string} cph
 * @property {string} userId
 * @property {string} submissionId
 * @property {string} status - DRAFT, or SUBMITTED once sent
 * @property {HeldAnimal[]} animals - in the order they were last saved
 */

export const DRAFT_STATUS = 'DRAFT'

/** @type {Map<string, Report>} */
const reports = new Map()

/**
 * @param {ReportKey} key
 * @returns {string} where the report is held; the id is read whatever its
 *   case, as the BE4FE's are
 */
function storeKey({ cph, submissionId, userId }) {
  return JSON.stringify([cph, userId, submissionId.toUpperCase()])
}

/**
 * @param {Report} report
 * @returns {void}
 */
export function holdReport(report) {
  reports.set(storeKey(report), report)
}

/**
 * @param {KeeperKey} keeper
 * @returns {Report | undefined} the keeper's report for the holding that has
 *   not been sent
 */
export function unsentReportOf({ cph, userId }) {
  return [...reports.values()].find(
    (report) =>
      report.cph === cph &&
      report.userId === userId &&
      report.status === DRAFT_STATUS
  )
}

/**
 * @param {ReportKey} key
 * @returns {Report}
 * @throws {Boom.Boom} not found, for a report the keeper does not have for
 *   the holding
 */
export function reportAt(key) {
  const report = reports.get(storeKey(key))

  if (!report) {
    throw Boom.notFound()
  }

  return report
}
