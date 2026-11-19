/*
 * TEMPORARY, until the cattle-death backend-for-frontend (BE4FE) exists:
 * what the pages need to know of a holding, answered from fixtures and
 * shaped as cattle-register's BE4FE data client. Keep these functions' shape
 * when they become calls to the BE4FE.
 */
import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import { holdingOf } from './holdings.js'
import { reportAt } from './store.js'

/** @import Boom from '@hapi/boom' */
/** @import { HoldingAnimal } from './holdings.js' */
/** @import { ReportKey } from './store.js' */

/**
 * The holding's cattle, alive and dead.
 * @param {{ cph: string }} holding
 * @returns {Promise<HoldingAnimal[]>}
 */
export async function getHoldingCattle({ cph }) {
  return holdingOf(cph).cattle.map((animal) => ({ ...animal }))
}

/**
 * The ear tags issued to the holding that are not yet on an animal, nor
 * used by another animal of the report.
 * @param {ReportKey} report
 * @returns {Promise<string[]>}
 * @throws {Boom.Boom} not found, for a report the keeper does not have for
 *   the holding
 */
export async function getUnusedEarTags(report) {
  const inReport = new Set(
    reportAt(report).animals.map(({ animalId }) => animalId)
  )

  return holdingOf(report.cph).unusedEarTags.filter(
    (earTag) => !inReport.has(plainEarTag(earTag))
  )
}
