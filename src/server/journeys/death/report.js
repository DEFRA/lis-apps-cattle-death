/*
 * The steps a death report goes through, in order. A death is the report's
 * answers so far. Each step's rules are in this directory, one file per
 * step.
 */
import Joi from 'joi'
import { createJourney } from '@defra/lis-infra-ui-services/journey'

import {
  isRegisteredSchema,
  REGISTERED,
  UNREGISTERED
} from './is-registered.js'

/** @import { Step } from '@defra/lis-infra-ui-services/journey' */
/** @import { DraftDeath } from '#server/services/be4fe/animal.js' */

/** @type {Step<DraftDeath, object>[]} */
const steps = [
  {
    page: 'is-registered',
    schema: isRegisteredSchema,
    // A registered animal is one of the holding's cattle, an unregistered
    // one is given one of its unused ear tags, and only an unregistered one
    // has its birth details asked for. The date of death means the same for
    // both, so it is kept.
    clearsOnChange: ['earTagNumber', 'dateOfBirth', 'sex', 'breed']
  },
  {
    page: 'registered-animal-details',
    schema: Joi.object({}),
    appliesTo: (death) => death.isRegistered === REGISTERED
  },
  {
    page: 'unregistered-animal-details',
    schema: Joi.object({}),
    appliesTo: (death) => death.isRegistered === UNREGISTERED
  }
]

export const deathReport = createJourney(steps)
