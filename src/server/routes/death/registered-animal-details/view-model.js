import { format } from 'date-fns'

import { DATE_FORMAT, toUkDate } from '#server/common/helpers/calendar-date.js'
import { backLinkPath, keepReturn } from '../check-return.js'
import { animalOrNewPath } from '../paths.js'
import { getMessage } from './messages.js'

/** @import { RegisteredAnimalDetailsAnswers } from '#server/journeys/death/registered-animal-details.js' */

const PAGE_TITLE = 'Animal details'
const FIELDS = ['earTagNumber', 'dateOfDeath']
export const REGISTERED_DETAILS_PAGE = 'registered-animal-details'

/**
 * @param {object} answers
 * @returns {Required<RegisteredAnimalDetailsAnswers>} each field's answer,
 *   blank when absent
 */
export function formValuesFrom(answers) {
  return /** @type {any} */ (
    Object.fromEntries(FIELDS.map((field) => [field, answers[field] ?? '']))
  )
}

/**
 * @param {object} options
 * @param {object} options.request
 * @param {Required<RegisteredAnimalDetailsAnswers>} options.values
 * @param {string[]} options.earTagItems - the ear tags of the holding's
 *   living cattle not already in the report
 * @param {{ field: string, code: string }[]} [options.errors]
 * @returns {object} the registered animal details view model
 */
export function buildViewModel({ request, values, earTagItems, errors = [] }) {
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
    backLinkHref: backLinkPath(
      request,
      animalOrNewPath(request.params, 'is-registered')
    ),
    formAction: keepReturn(
      request,
      animalOrNewPath(request.params, REGISTERED_DETAILS_PAGE)
    ),
    values,
    earTagItems,
    maxDateOfDeath: format(toUkDate(new Date()), DATE_FORMAT),
    errorList,
    fieldErrors
  }
}
