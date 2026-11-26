import { holdingHomePath } from '../paths.js'

export const CONFIRMATION_PAGE = 'confirmation'

/**
 * @param {number} animalCount
 * @returns {string} what was reported, a single death worded as one
 */
function reported(animalCount) {
  return animalCount === 1
    ? '1 death reported'
    : `${animalCount} deaths reported`
}

/**
 * @param {number} animalCount
 * @returns {string} that the report arrived, a single death worded as one
 */
function received(animalCount) {
  const reports = animalCount === 1 ? 'report' : 'reports'

  return `We have received your death ${reports}. You will also receive a confirmation email.`
}

/**
 * @param {number} animalCount
 * @returns {string} what the keeper hears after the review, a single death
 *   worded as one
 */
function reviewed(animalCount) {
  const reports = animalCount === 1 ? 'report has' : 'reports have'

  return `You will receive an email once your ${reports} been reviewed if it is successful or we require further information.`
}

/**
 * @param {object} options
 * @param {object} options.request
 * @param {number} options.animalCount - how many animals the report sent
 * @returns {object} the death report sent view model
 */
export function buildViewModel({ request, animalCount }) {
  const title = reported(animalCount)

  return {
    pageTitle: title,
    heading: title,
    received: received(animalCount),
    reviewed: reviewed(animalCount),
    homeHref: holdingHomePath(request.params.cph)
  }
}
