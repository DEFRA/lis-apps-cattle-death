/*
 * A Change link on check animal details opens a page marked to return there.
 * The mark is one fixed word in the query, never a URL, so it cannot send
 * the user off the service.
 */
/** @import { Request } from '@hapi/hapi' */
/** @import { DraftDeath } from '#server/services/be4fe/animal.js' */
import { animalPagePath } from './paths.js'
import { deathReport } from '#server/journeys/death/report.js'

export const CHECK_PAGE = 'check-animal-details'
const RETURN_TO_CHECK = 'check'

/**
 * @param {Request} request
 * @returns {boolean} true when the page was reached from a Change link on
 *   check animal details
 */
export function isReturningToCheck(request) {
  return request.query?.return === RETURN_TO_CHECK
}

/**
 * @param {string} path
 * @returns {string} the path, marked as reached from check animal details
 */
export function withReturnToCheck(path) {
  return `${path}?return=${RETURN_TO_CHECK}`
}

/**
 * @param {Request} request
 * @param {string} path
 * @returns {string} the path, still marked as reached from check animal
 *   details when the request was
 */
export function keepReturn(request, path) {
  return isReturningToCheck(request) ? withReturnToCheck(path) : path
}

/**
 * Where a page goes after a successful save. Normally the animal's next
 * page, or check animal details after its last. After a Change link, back to
 * check animal details, unless the change left a page unanswered (a changed
 * answer to whether the animal is registered clears its details), in which
 * case that page, still marked to return.
 * @param {Request} request
 * @param {string} page - the page that saved
 * @param {DraftDeath} death - the animal's answers as saved
 * @returns {string} the path to redirect to
 */
export function pathAfterSave(request, page, death) {
  const { cph, submissionId, animalId } = request.params

  if (!isReturningToCheck(request)) {
    return animalPagePath(
      cph,
      submissionId,
      animalId,
      deathReport.nextPage(page, death) ?? CHECK_PAGE
    )
  }

  const unanswered = deathReport.firstUnansweredPage(death)

  return unanswered
    ? withReturnToCheck(animalPagePath(cph, submissionId, animalId, unanswered))
    : animalPagePath(cph, submissionId, animalId, CHECK_PAGE)
}

/**
 * @param {Request} request
 * @param {string} previousPath - the previous page in the journey
 * @returns {string} check animal details after a Change link, otherwise the
 *   previous page
 */
export function backLinkPath(request, previousPath) {
  const { cph, submissionId, animalId } = request.params

  return isReturningToCheck(request)
    ? animalPagePath(cph, submissionId, animalId, CHECK_PAGE)
    : previousPath
}
