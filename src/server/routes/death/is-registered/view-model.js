import { backLinkPath, keepReturn } from '../check-return.js'
import {
  animalPagePath,
  holdingHomePath,
  newAnimalPath,
  submissionPath
} from '../paths.js'
import { getMessage } from './messages.js'

/** @import { IsRegisteredAnswers } from '#server/journeys/death/is-registered.js' */

const PAGE_TITLE = 'Is the animal registered on your holding?'
export const IS_REGISTERED_PAGE = 'is-registered'

/**
 * @param {object} answers
 * @returns {Required<IsRegisteredAnswers>} the answer, blank when absent
 */
export function formValuesFrom(answers) {
  return { isRegistered: answers.isRegistered ?? '' }
}

/**
 * @param {object} options
 * @param {object} options.request
 * @param {Required<IsRegisteredAnswers>} options.values
 * @param {{ field: string, code: string }[]} [options.errors]
 * @param {boolean} [options.isFirstAnimal] - whether the page is where the
 *   report starts: a new animal, in a report with none
 * @returns {object} the is the animal registered view model
 */
export function buildViewModel({
  request,
  values,
  errors = [],
  isFirstAnimal = false
}) {
  const { cph, submissionId, animalId } = request.params
  const errorList = errors.map((error) => ({
    text: getMessage(error),
    href: `#${error.field}`
  }))
  const fieldErrors = Object.fromEntries(
    errors.map((error) => [error.field, { text: getMessage(error) }])
  )

  return {
    pageTitle: errors.length ? `Error: ${PAGE_TITLE}` : PAGE_TITLE,
    heading: PAGE_TITLE,
    // The first animal is where the report starts, from the holding; any
    // other is reached from the list of animals.
    backLinkHref: backLinkPath(
      request,
      isFirstAnimal ? holdingHomePath(cph) : submissionPath(cph, submissionId)
    ),
    formAction: animalId
      ? keepReturn(
          request,
          animalPagePath(cph, submissionId, animalId, IS_REGISTERED_PAGE)
        )
      : newAnimalPath(cph, submissionId, IS_REGISTERED_PAGE),
    values,
    errorList,
    fieldErrors
  }
}
