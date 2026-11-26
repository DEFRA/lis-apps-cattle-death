/** @import { Request } from '@hapi/hapi' */
/** @import { ReportKey } from '#server/services/be4fe/client.js' */
/** @import { AnimalKey } from '#server/services/be4fe/animal.js' */

/**
 * @param {Request} request
 * @returns {{ cph: string }} the holding in the path
 */
export function holdingOf(request) {
  return { cph: request.params.cph }
}

/**
 * @param {Request} request
 * @returns {ReportKey} the holding's death report in the path
 */
export function reportOf(request) {
  return {
    ...holdingOf(request),
    submissionId: request.params.submissionId
  }
}

/**
 * @param {Request} request
 * @returns {AnimalKey} the animal in the path, in the holding's death
 *   report
 */
export function animalOf(request) {
  return {
    ...reportOf(request),
    animalId: request.params.animalId
  }
}
