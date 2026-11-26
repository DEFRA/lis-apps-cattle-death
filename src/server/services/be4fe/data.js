import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import {
  be4fe,
  earTagsPath,
  holdingDataPath
} from '#server/services/be4fe/client.js'
import { getSubmission } from './submission.js'

/** @import Boom from '@hapi/boom' */
/** @import { ReportKey } from './client.js' */

/**
 * @typedef {object} HoldingAnimal - one of the cattle on the holding
 * @property {string} earTagNumber
 */

/**
 * The holding's cattle: those alive and on it.
 * @param {{ cph: string }} holding
 * @returns {Promise<HoldingAnimal[]>}
 * @throws {Boom.Boom} not found, for a holding the BE4FE does not know
 */
export async function getHoldingCattle({ cph }) {
  const { payload } = await be4fe.get(`${holdingDataPath(cph)}/animals`)

  return (payload.animals ?? []).map(({ eartag }) => ({
    earTagNumber: eartag
  }))
}

/**
 * The ear tags issued to the holding that are not yet on an animal, nor
 * used by another animal of the report.
 * @param {ReportKey} report
 * @returns {Promise<string[]>}
 * @throws {Boom.Boom} not found, for a holding the BE4FE does not know, or
 *   a report it does not hold under the holding
 */
export async function getUnusedEarTags({ cph, submissionId }) {
  const { animals } = await getSubmission({ cph, submissionId })
  const inReport = new Set(animals.map(({ animalId }) => animalId))
  const { payload } = await be4fe.get(`${earTagsPath(cph)}/unallocated`)

  return (payload.eartags ?? [])
    .map(({ eartag }) => eartag)
    .filter((earTag) => !inReport.has(plainEarTag(earTag)))
}
