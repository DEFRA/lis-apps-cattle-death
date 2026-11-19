/*
 * TEMPORARY, until the cattle-death backend-for-frontend (BE4FE) exists:
 * what this spoke would ask the BE4FE about a holding's cattle and ear tags,
 * as fixtures held in this process's memory. Every holding starts with the
 * same cattle and ear tags, and a sent death report changes only its own
 * holding's, until the process restarts.
 */
import { plainEarTag } from '#server/common/helpers/ear-tag.js'

/**
 * @typedef {object} HoldingAnimal - one of a holding's cattle
 * @property {string} earTagNumber
 * @property {string} status - alive or dead
 */

/**
 * @typedef {object} Holding - what is known of a holding
 * @property {HoldingAnimal[]} cattle
 * @property {string[]} unusedEarTags - the ear tags issued to the holding
 *   that are not on an animal
 */

/**
 * @typedef {object} ReportedDeath - the animal a sent death report is about
 * @property {string} isRegistered - yes or no
 * @property {string} earTagNumber
 */

export const ALIVE = 'alive'
export const DEAD = 'dead'
const REGISTERED = 'yes'

/** @type {HoldingAnimal[]} */
const FIXTURE_CATTLE = [
  { earTagNumber: 'UK123456301550', status: ALIVE },
  { earTagNumber: 'UK123456301551', status: ALIVE },
  { earTagNumber: 'UK123456301552', status: ALIVE },
  { earTagNumber: 'UK123456301553', status: DEAD },
  { earTagNumber: 'UK123456301554', status: ALIVE }
]

const FIXTURE_UNUSED_EAR_TAGS = [
  'UK123456401560',
  'UK123456401561',
  'UK123456401562',
  'UK123456401563',
  'UK123456401564'
]

// A report about one of these always fails to send, so the problem a failed
// send shows can be seen
export const FAILS_TO_SEND = new Set(['UK123456301554', 'UK123456401564'])

/** @type {Map<string, Holding>} */
const holdings = new Map()

/**
 * @param {string} cph
 * @returns {Holding} the holding, starting from the fixtures the first time
 *   it is asked for
 */
export function holdingOf(cph) {
  if (!holdings.has(cph)) {
    holdings.set(cph, {
      cattle: FIXTURE_CATTLE.map((animal) => ({ ...animal })),
      unusedEarTags: [...FIXTURE_UNUSED_EAR_TAGS]
    })
  }

  return holdings.get(cph)
}

/**
 * A death once sent is the holding's: a registered animal is then dead, and
 * an unregistered one's ear tag is on a dead animal.
 * @param {string} cph
 * @param {ReportedDeath} death
 * @returns {void}
 */
export function recordDeath(cph, { isRegistered, earTagNumber }) {
  const holding = holdingOf(cph)
  const id = plainEarTag(earTagNumber)

  if (isRegistered === REGISTERED) {
    for (const animal of holding.cattle) {
      if (plainEarTag(animal.earTagNumber) === id) {
        animal.status = DEAD
      }
    }

    return
  }

  holding.unusedEarTags = holding.unusedEarTags.filter(
    (earTag) => plainEarTag(earTag) !== id
  )
  holding.cattle.push({ earTagNumber, status: DEAD })
}
