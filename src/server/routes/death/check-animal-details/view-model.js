import { formatEarTag } from '@defra/lis-infra-ui-services/nunjucks/filters'
import { format, parse } from 'date-fns'

import { DATE_FORMAT } from '#server/common/helpers/calendar-date.js'
import { deathReport } from '#server/journeys/death/report.js'
import { UNREGISTERED } from '#server/journeys/death/is-registered.js'
import { breedOptions } from '#server/journeys/death/unregistered-animal-details.js'
import { CHECK_PAGE, withReturnToCheck } from '../check-return.js'
import { animalPagePath } from '../paths.js'

/** @import { DraftDeath } from '#server/services/be4fe/animal.js' */

const PAGE_TITLE = 'Check animal details'
const IS_REGISTERED_PAGE = 'is-registered'
const SHOWN_DATE_FORMAT = 'd MMMM yyyy'
const YES_NO_TEXT = { yes: 'Yes', no: 'No' }
const SEX_TEXT = { male: 'Male', female: 'Female' }

/**
 * @param {string} date - D/M/YYYY, as saved
 * @returns {string} e.g. "1 November 2026"
 */
function formatDate(date) {
  return format(parse(date, DATE_FORMAT, new Date()), SHOWN_DATE_FORMAT)
}

/**
 * @param {string} code - the breed code, as saved
 * @returns {string} the breed as its autocomplete shows it
 */
function breedText(code) {
  return breedOptions.find(({ value }) => value === code)?.text ?? code
}

/**
 * @param {string} key
 * @param {string} value
 * @param {{ href: string, visuallyHiddenText: string }} change
 * @returns {object} a summary list row with a Change link
 */
function row(key, value, { href, visuallyHiddenText }) {
  return {
    key: { text: key },
    value: { text: value },
    actions: {
      items: [{ href, text: 'Change', visuallyHiddenText }]
    }
  }
}

/**
 * @param {DraftDeath} death - the saved animal
 * @param {(page: string, field: string) => string} changeHref - the Change
 *   link to a field on a page
 * @returns {object[]} every row of the summary list, in the prototype's
 *   order: an unregistered animal's birth details as well
 */
function summaryRows(death, changeHref) {
  const detailsPage = deathReport.nextPage(IS_REGISTERED_PAGE, death)
  const isUnregistered = death.isRegistered === UNREGISTERED
  const detail = (key, value, field, visuallyHiddenText) =>
    row(key, value, {
      href: changeHref(detailsPage, field),
      visuallyHiddenText
    })

  return [
    row('Animal registered', YES_NO_TEXT[death.isRegistered], {
      href: changeHref(IS_REGISTERED_PAGE, 'isRegistered'),
      visuallyHiddenText: 'whether the animal is registered'
    }),
    detail(
      'Animal ear tag number',
      formatEarTag(death.earTagNumber),
      'earTagNumber',
      'animal ear tag number'
    ),
    ...(isUnregistered
      ? [
          detail(
            'Date of birth',
            formatDate(death.dateOfBirth),
            'dateOfBirth',
            'date of birth'
          )
        ]
      : []),
    detail(
      'Date of death',
      formatDate(death.dateOfDeath),
      'dateOfDeath',
      'date of death'
    ),
    ...(isUnregistered
      ? [
          detail('Sex', SEX_TEXT[death.sex], 'sex', 'sex'),
          detail('Breed', breedText(death.breed), 'breed', 'breed')
        ]
      : [])
  ]
}

/**
 * @param {object} options
 * @param {object} options.request
 * @param {DraftDeath} options.death - the saved animal, with every page
 *   answered
 * @returns {object} the check animal details view model
 */
export function buildViewModel({ request, death }) {
  const { cph, submissionId, animalId } = request.params
  const pagePath = (page) => animalPagePath(cph, submissionId, animalId, page)
  // A Change link opens the field it is about
  const changeHref = (page, field) =>
    `${withReturnToCheck(pagePath(page))}#${field}`

  return {
    pageTitle: PAGE_TITLE,
    heading: PAGE_TITLE,
    backLinkHref: pagePath(deathReport.nextPage(IS_REGISTERED_PAGE, death)),
    formAction: pagePath(CHECK_PAGE),
    rows: summaryRows(death, changeHref)
  }
}
