import { getMountPath } from '@defra/lis-hubs-infra-registry'

export const DEATH_ROUTE = '/holdings/{cph*3}/cattle/death'

/**
 * @param {string} cph
 * @returns {string} the path that starts, or continues, the keeper's death
 *   report for the holding
 */
export function deathPath(cph) {
  return getMountPath('cattle-death', 'holding', { cph })
}

/**
 * @param {string} cph
 * @param {string} submissionId
 * @returns {string} the path of a death report: the list of its animals
 */
export function submissionPath(cph, submissionId) {
  return `${deathPath(cph)}/${submissionId}`
}

/**
 * @param {string} cph
 * @param {string} submissionId
 * @param {string} page
 * @returns {string} the path of a page about a whole death report
 */
export function submissionPagePath(cph, submissionId, page) {
  return `${submissionPath(cph, submissionId)}/${page}`
}

/**
 * @param {string} cph
 * @param {string} submissionId
 * @param {string} animalId - the animal's id in the report: its ear tag
 *   number
 * @param {string} page
 * @returns {string} the path of a page about one animal in a death report
 */
export function animalPagePath(cph, submissionId, animalId, page) {
  return `${submissionPath(cph, submissionId)}/animals/${encodeURIComponent(animalId)}/${page}`
}

/**
 * @param {string} cph
 * @param {string} submissionId
 * @param {string} page
 * @returns {string} the path of a page about an animal the report does not
 *   have yet
 */
export function newAnimalPath(cph, submissionId, page) {
  return `${submissionPath(cph, submissionId)}/animals/${page}`
}

/**
 * @param {string} cph
 * @returns {string} the path of the holding's page in cattle-home
 */
export function holdingHomePath(cph) {
  return getMountPath('cattle-home', 'holding', { cph })
}

/**
 * @param {{ cph: string, submissionId: string, animalId?: string }} params
 * @param {string} page
 * @returns {string} the path of a page about an animal: the report's own
 *   page for one it has, otherwise a new animal's
 */
export function animalOrNewPath({ cph, submissionId, animalId }, page) {
  return animalId
    ? animalPagePath(cph, submissionId, animalId, page)
    : newAnimalPath(cph, submissionId, page)
}
