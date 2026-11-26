import { format } from 'date-fns'

import { DATE_FORMAT, toUkDate } from '#server/common/helpers/calendar-date.js'
import { backLinkPath, keepReturn } from '../check-return.js'
import { animalOrNewPath } from '../paths.js'
import { getMessage } from './messages.js'
import { breedOptions } from '#server/journeys/death/unregistered-animal-details.js'

/** @import { UnregisteredAnimalDetailsAnswers } from '#server/journeys/death/unregistered-animal-details.js' */

const PAGE_TITLE = 'Animal details'
const FIELDS = ['earTagNumber', 'dateOfBirth', 'dateOfDeath', 'sex', 'breed']
export const UNREGISTERED_DETAILS_PAGE = 'unregistered-animal-details'

/**
 * @param {object} answers
 * @returns {Required<UnregisteredAnimalDetailsAnswers>} each field's answer,
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
 * @param {Required<UnregisteredAnimalDetailsAnswers>} options.values
 * @param {string[]} options.earTagItems - the ear tags the animal can be
 *   given: the holding's unused ones, and the one it already has
 * @param {{ field: string, code: string }[]} [options.errors]
 * @returns {object} the unregistered animal details view model
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
      animalOrNewPath(request.params, UNREGISTERED_DETAILS_PAGE)
    ),
    values,
    earTagItems,
    breedItems: breedOptions,
    maxDate: format(toUkDate(new Date()), DATE_FORMAT),
    errorList,
    fieldErrors
  }
}
