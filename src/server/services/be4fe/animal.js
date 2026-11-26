/*
 * Here an animal is one flat record of its answers (a DraftDeath); the BE4FE
 * holds it as a list of data items, one per answer, keyed by the record's
 * property names. Only this file translates between the two. An animal's id
 * is its ear tag number without spaces, so it has none until its details
 * are saved.
 */
import { format, isValid, parse } from 'date-fns'

import {
  DATE_FORMAT,
  ISO_DATE_FORMAT
} from '#server/common/helpers/calendar-date.js'
import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import { submissions } from '#server/services/be4fe/client.js'

/** @import Boom from '@hapi/boom' */
/** @import { ReportKey } from './client.js' */

/**
 * @typedef {object} DraftDeath - an animal's answers so far
 * @property {string} [isRegistered] - yes or no
 * @property {string} [earTagNumber]
 * @property {string} [dateOfBirth] - D/M/YYYY; an unregistered animal's only
 * @property {string} [dateOfDeath] - D/M/YYYY
 * @property {string} [sex] - male or female; an unregistered animal's only
 * @property {string} [breed] - the breed code; an unregistered animal's only
 */

/**
 * @typedef {ReportKey & { animalId: string }} AnimalKey - an animal in a
 *   holding's death report; its id in the report is its ear tag number
 */

/**
 * @typedef {object} DataItem - one of an animal's answers, as the BE4FE holds it
 * @property {string} key - the answer's name: the DraftDeath property
 * @property {string | null} value
 * @property {string} type - STRING or DATE
 */

// An animal is only saved once its details are given in full
const COMPLETE_STATUS = 'COMPLETE'
const STRING_TYPE = 'STRING'
const DATE_TYPE = 'DATE'
// The answers the BE4FE holds as other than text; every other one is text
const ANSWER_TYPES = new Map([
  ['dateOfBirth', DATE_TYPE],
  ['dateOfDeath', DATE_TYPE]
])

/**
 * @param {string | null} value - a date in one form
 * @param {string} from - the form it is in
 * @param {string} to - the form to give it in
 * @returns {string | null} the date in the other form; a value that is not
 *   a date in the first is given as it is
 */
function dateIn(value, from, to) {
  const date = parse(value ?? '', from, new Date())

  return isValid(date) ? format(date, to) : value
}

/**
 * @param {DraftDeath} values
 * @returns {DataItem[]} one item per answer given, a date as an ISO date; an
 *   absent answer is left out
 */
function toDataItems(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const type = ANSWER_TYPES.get(key) ?? STRING_TYPE

      return {
        key,
        value:
          type === DATE_TYPE
            ? dateIn(value, DATE_FORMAT, ISO_DATE_FORMAT)
            : value,
        type
      }
    })
}

/**
 * @param {DataItem[]} data
 * @returns {DraftDeath} the answers the items hold, a date as the pages take
 *   it
 */
function fromDataItems(data) {
  return /** @type {DraftDeath} */ (
    Object.fromEntries(
      data.map(({ key, value, type }) => [
        key,
        type === DATE_TYPE ? dateIn(value, ISO_DATE_FORMAT, DATE_FORMAT) : value
      ])
    )
  )
}

/**
 * @param {AnimalKey} key
 * @returns {Promise<DraftDeath>} the animal's answers so far
 * @throws {Boom.Boom} not found, for an animal the BE4FE does not hold, as
 *   it answers for a report it does not hold under the holding, too
 */
export async function getAnimal({ cph, submissionId, animalId }) {
  const { data } = await submissions.getAnimal({
    cph,
    submissionId,
    animalId: plainEarTag(animalId)
  })

  return fromDataItems(data)
}

/**
 * Replaces the animal, adding it to the report on its first save; the
 * report then lists it last. An animal's id is its ear tag number: one saved
 * with no id is added under the one it is given, and one saved with another
 * is saved under that one, then taken out from under its old id.
 * @param {Omit<AnimalKey, 'animalId'> & { animalId?: string, values: DraftDeath }} animal
 *   animalId is the animal's id as it is now; absent for a new animal
 * @returns {Promise<{ animalId: string }>} the animal's id once saved
 * @throws {Boom.Boom} not found, for a report the BE4FE does not hold under
 *   the holding
 */
export async function saveAnimal({ cph, submissionId, animalId, values }) {
  const savedId = values.earTagNumber
    ? plainEarTag(values.earTagNumber)
    : animalId

  await submissions.saveAnimal({
    cph,
    submissionId,
    animalId: savedId,
    previousAnimalId: animalId && plainEarTag(animalId),
    status: COMPLETE_STATUS,
    data: toDataItems(values)
  })

  return { animalId: savedId }
}
