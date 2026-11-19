/*
 * TEMPORARY, until the cattle-death backend-for-frontend (BE4FE) exists:
 * the animals of a keeper's death report, shaped as cattle-register's BE4FE
 * animal client so the BE4FE's client can take its place. An animal's id is
 * its ear tag number without spaces, so it has none until its details are
 * saved.
 */
import Boom from '@hapi/boom'

import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import { reportAt } from './store.js'
import { SUBMITTED_STATUS } from './submission.js'

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
 * @typedef {object} AnimalKey - an animal in one of a keeper's death reports
 * @property {string} cph - the holding, as 12/345/6789
 * @property {string} submissionId
 * @property {string} userId - the keeper's user id
 * @property {string} animalId - the animal's id in the report: its ear tag
 *   number
 */

/**
 * @param {AnimalKey} key
 * @returns {Promise<DraftDeath>} the animal's answers so far
 * @throws {Boom.Boom} not found, for an animal the report does not have, or
 *   a report the keeper does not have for the holding
 */
export async function getAnimal({ animalId, ...key }) {
  const animal = reportAt(key).animals.find(
    (held) => held.animalId === plainEarTag(animalId)
  )

  if (!animal) {
    throw Boom.notFound()
  }

  return { ...animal.death }
}

/**
 * Replaces the animal, adding it to the report on its first save; the
 * report then lists it last. An animal's id is its ear tag number: one saved
 * with no id is added under the one it is given, and one saved with another
 * is saved under that one, then taken out from under its old id.
 * @param {Omit<AnimalKey, 'animalId'> & { animalId?: string, values: DraftDeath }} animal
 *   animalId is the animal's id as it is now; absent for a new animal
 * @returns {Promise<{ animalId: string }>} the animal's id once saved
 * @throws {Boom.Boom} not found, for a report the keeper does not have for
 *   the holding; conflict, for one already sent, which is finished
 */
export async function saveAnimal({ animalId, values, ...key }) {
  const report = reportAt(key)

  if (report.status === SUBMITTED_STATUS) {
    throw Boom.conflict('The death report has been sent')
  }
  const savedId = values.earTagNumber
    ? plainEarTag(values.earTagNumber)
    : animalId
  const replaced = new Set([savedId, animalId && plainEarTag(animalId)])

  report.animals = [
    ...report.animals.filter((held) => !replaced.has(held.animalId)),
    { animalId: savedId, death: { ...values } }
  ]

  return { animalId: savedId }
}
