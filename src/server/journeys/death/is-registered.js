/*
 * The rules for the step that asks whether the animal is registered to the
 * holding. The death report keeps whatever it is given, so every field rule
 * lives here and runs before anything is saved.
 */
import Joi from 'joi'

import { answer, REQUIRED } from './answer.js'

export const REGISTERED = 'yes'
export const UNREGISTERED = 'no'

/**
 * @typedef {object} IsRegisteredAnswers
 * @property {string} [isRegistered] - yes or no
 */

/**
 * Whether the animal is registered. Each rule's message is the code of its
 * error, which the page words in its messages.js.
 */
export const isRegisteredSchema = Joi.object({
  isRegistered: answer()
    .valid(REGISTERED, UNREGISTERED)
    .messages({ 'any.only': REQUIRED })
}).messages({ 'any.required': REQUIRED })
