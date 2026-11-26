import { differenceInCalendarDays, isValid, parse } from 'date-fns'

import { DATE_FORMAT, toUkDate } from '#server/common/helpers/calendar-date.js'
import { answer } from './answer.js'

/** @import Joi from 'joi' */

const DATE_PARTS = 3
const YEAR_DIGITS = 4

/**
 * @param {string} value - a date as typed, D/M/YYYY
 * @returns {Date | undefined} the date; undefined for anything that is not a
 *   day, a month and a four digit year of a real date
 */
export function parsedDate(value) {
  const parts = value.split('/')
  const date = parse(value, DATE_FORMAT, toUkDate(new Date()))

  // date-fns reads a shorter year as that year: 26 as the year 26
  return parts.length === DATE_PARTS &&
    parts.at(-1).length === YEAR_DIGITS &&
    isValid(date)
    ? date
    : undefined
}

/**
 * @param {string} value - not blank
 * @param {object} helpers - Joi's
 * @returns {string | object} the date, or the Joi error
 */
function checkPastDate(value, helpers) {
  const date = parsedDate(value)

  if (!date) {
    return helpers.message('invalid')
  }

  if (differenceInCalendarDays(toUkDate(new Date()), date) < 0) {
    return helpers.message('future')
  }

  return value
}

/**
 * @returns {Joi.StringSchema} a date that must be given, D/M/YYYY:
 *   a real one, today or before, in UK time
 */
export function pastDate() {
  return answer().custom(checkPastDate)
}
