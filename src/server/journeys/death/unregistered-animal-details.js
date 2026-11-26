/*
 * The rules for the details of an unregistered animal: a calf that died
 * before its birth was registered, given one of the holding's unused ear
 * tags. Every field rule lives here and runs before anything is saved.
 */
import { breeds } from '@defra/lis-species-cattle'
import Joi from 'joi'

import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import { answer, REQUIRED } from './answer.js'
import { checkPastDate, parsedDate, pastDate } from './date-answer.js'

/**
 * Each cattle breed as an item of the breed autocomplete: it shows
 * "Name (CODE)" and submits the code.
 * @type {{ value: string, text: string }[]}
 */
export const breedOptions = Object.entries(breeds).map(([code, name]) => ({
  value: code,
  text: `${name} (${code})`
}))

/**
 * @typedef {object} UnregisteredAnimalDetailsAnswers
 * @property {string} [earTagNumber]
 * @property {string} [dateOfBirth] - D/M/YYYY
 * @property {string} [dateOfDeath] - D/M/YYYY
 * @property {string} [sex] - male or female
 * @property {string} [breed] - the breed code
 */

/**
 * The ear tag must not be another animal's of the report, and must be one
 * the animal can be given. Ear tag numbers are compared however they are
 * spaced or cased.
 * @param {string} earTagNumber - not blank
 * @param {object} helpers - Joi's, with `availableEarTags` and
 *   `reportedEarTags` (the ids of the report's other animals) in its context
 * @returns {string | object} the ear tag number, or the Joi error
 */
function checkAvailableEarTag(earTagNumber, helpers) {
  /** @type {{ availableEarTags: string[], reportedEarTags: string[] }} */
  const { availableEarTags, reportedEarTags } = helpers.prefs.context
  const id = plainEarTag(earTagNumber)

  if (reportedEarTags.includes(id)) {
    return helpers.message('alreadyReported')
  }

  return availableEarTags.some((earTag) => plainEarTag(earTag) === id)
    ? earTagNumber
    : helpers.message('notAvailable')
}

/**
 * A real date, today or before, and not before the date of birth when that
 * is a real date too.
 * @param {string} dateOfDeath - not blank
 * @param {object} helpers - Joi's
 * @returns {string | object} the date of death, or the Joi error
 */
function checkDateOfDeath(dateOfDeath, helpers) {
  const checked = checkPastDate(dateOfDeath, helpers)

  if (checked !== dateOfDeath) {
    return checked
  }

  const born = parsedDate(helpers.state.ancestors[0].dateOfBirth ?? '')

  return born && parsedDate(dateOfDeath) < born
    ? helpers.message('beforeBirth')
    : dateOfDeath
}

/**
 * An unregistered animal's details. Each rule's message is the code of its
 * error, which the page words in its messages.js. Validate it with, as
 * context, `availableEarTags` (the ear tags the animal can be given: the
 * holding's unused ones, and the one it already has) and `reportedEarTags`.
 */
export const unregisteredAnimalDetailsSchema = Joi.object({
  earTagNumber: answer().custom(checkAvailableEarTag),
  dateOfBirth: pastDate(),
  dateOfDeath: answer().custom(checkDateOfDeath),
  sex: answer().valid('male', 'female').messages({ 'any.only': REQUIRED }),
  breed: answer()
    .valid(...Object.keys(breeds))
    .messages({ 'any.only': 'unknown' })
}).messages({ 'any.required': REQUIRED })
