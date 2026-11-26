/*
 * The rules for the details of a registered animal: one of the holding's
 * cattle and not already in the report. Every field rule lives here
 * and runs before anything is saved.
 */
import Joi from 'joi'

import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import { answer, REQUIRED } from './answer.js'
import { pastDate } from './date-answer.js'

/** @import { HoldingAnimal } from '#server/services/be4fe/data.js' */

/**
 * @typedef {object} RegisteredAnimalDetailsAnswers
 * @property {string} [earTagNumber]
 * @property {string} [dateOfDeath] - D/M/YYYY
 */

/**
 * The animal must be one of the holding's and not another animal of
 * the report. Ear tag numbers are compared however they are spaced or cased.
 * @param {string} earTagNumber - not blank
 * @param {object} helpers - Joi's, with `holdingCattle` (HoldingAnimal[])
 *   and `reportedEarTags` (the ids of the report's other animals) in its
 *   context
 * @returns {string | object} the ear tag number, or the Joi error
 */
function checkRegisteredAnimal(earTagNumber, helpers) {
  /** @type {{ holdingCattle: HoldingAnimal[], reportedEarTags: string[] }} */
  const { holdingCattle, reportedEarTags } = helpers.prefs.context
  const id = plainEarTag(earTagNumber)

  // An animal of the report may be one the holding does not have, given an
  // unused ear tag, so being in the report is judged first
  if (reportedEarTags.includes(id)) {
    return helpers.message('alreadyReported')
  }

  const onHolding = holdingCattle.some(
    (candidate) => plainEarTag(candidate.earTagNumber) === id
  )

  return onHolding ? earTagNumber : helpers.message('notOnHolding')
}

/**
 * A registered animal's details. Each rule's message is the code of its
 * error, which the page words in its messages.js. Validate it with, as
 * context, `holdingCattle` and `reportedEarTags`.
 */
export const registeredAnimalDetailsSchema = Joi.object({
  earTagNumber: answer().custom(checkRegisteredAnimal),
  dateOfDeath: pastDate()
}).messages({ 'any.required': REQUIRED })
