import { holdingHomePath } from '../paths.js'

export const CONFIRMATION_PAGE = 'confirmation'

/**
 * @param {number} animalCount
 * @returns {string} what was reported, a single death worded as one
 */
function reported(animalCount) {
  return animalCount === 1
    ? '1 cattle death reported'
    : `${animalCount} cattle deaths reported`
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
    homeHref: holdingHomePath(request.params.cph)
  }
}
