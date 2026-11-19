/** @import { Request } from '@hapi/hapi' */
/** @import { KeeperKey, ReportKey } from '#server/services/temporary-be4fe/store.js' */
/** @import { AnimalKey } from '#server/services/temporary-be4fe/animal.js' */

/**
 * @param {Request} request
 * @returns {KeeperKey} the signed-in keeper, on the holding in the path
 */
export function keeperOf(request) {
  return {
    cph: request.params.cph,
    userId: request.auth.credentials.user.sub
  }
}

/**
 * @param {Request} request
 * @returns {ReportKey} the death report in the path, of the signed-in keeper
 */
export function reportOf(request) {
  return {
    ...keeperOf(request),
    submissionId: request.params.submissionId
  }
}

/**
 * @param {Request} request
 * @returns {AnimalKey} the animal in the path, in the signed-in keeper's
 *   death report
 */
export function animalOf(request) {
  return {
    ...reportOf(request),
    animalId: request.params.animalId
  }
}
