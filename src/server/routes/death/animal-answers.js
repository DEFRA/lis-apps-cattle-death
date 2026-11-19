import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import { deathReport } from '#server/journeys/death/report.js'
import { animalOf, reportOf } from './report-key.js'
import { MAX_ANIMALS } from './tag-list/messages.js'

/** @import { Request } from '@hapi/hapi' */
/** @import { DraftDeath } from '#server/services/temporary-be4fe/animal.js' */

/**
 * @param {Request} request
 * @returns {Promise<DraftDeath>} the animal's answers: none for a new animal
 * @throws {Error} not found, for an id the report has no animal under
 */
export async function answersOf(request) {
  if (request.params.animalId === undefined) {
    return {}
  }

  return animalClient.getAnimal(animalOf(request))
}

/**
 * A details page answers whether the animal is registered by being the page
 * for its branch, so the animal is judged and saved as that branch: the
 * other branch's details are cleared.
 * @param {DraftDeath} death - the animal as saved
 * @param {string} isRegistered - the branch of the page: yes or no
 * @returns {DraftDeath} the animal as its details page has it
 */
export function asBranch(death, isRegistered) {
  return deathReport.withAnswers('is-registered', death, { isRegistered })
}

/**
 * @param {Request} request
 * @returns {Promise<string[]>} the ids, so ear tag numbers, of the report's
 *   animals other than the one in the path
 * @throws {Error} not found, for a report the keeper does not have
 */
export async function reportedEarTagsOf(request) {
  const own = plainEarTag(request.params.animalId ?? '')
  const { animals } = await submissionClient.getSubmission(reportOf(request))

  return animals
    .map(({ animalId }) => animalId)
    .filter((animalId) => animalId !== own)
}

/**
 * @param {Request} request
 * @returns {Promise<number | undefined>} how many animals the report already
 *   has, for a new animal; undefined for one it has
 * @throws {Error} not found, for a report the keeper does not have
 */
export async function animalsBeforeNew(request) {
  if (request.params.animalId !== undefined) {
    return undefined
  }

  const { animals } = await submissionClient.getSubmission(reportOf(request))

  return animals.length
}

/**
 * @param {number | undefined} animalsBefore - as animalsBeforeNew gives it
 * @returns {boolean} whether the animal is a new one that the report has no
 *   room for, as the list of animals allows no more; an animal it has is
 *   never turned away
 */
export function isFull(animalsBefore) {
  return animalsBefore !== undefined && animalsBefore >= MAX_ANIMALS
}
