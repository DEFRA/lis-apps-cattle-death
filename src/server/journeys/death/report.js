/*
 * The steps a death report goes through, in order. A death is the report's
 * answers so far. Each step's rules are in this directory, one file per
 * step.
 */
import { createJourney } from '@defra/lis-infra-ui-services/journey'

import { registeredAnimalDetailsSchema } from './registered-animal-details.js'
import { unregisteredAnimalDetailsSchema } from './unregistered-animal-details.js'
import {
  isRegisteredSchema,
  REGISTERED,
  UNREGISTERED
} from './is-registered.js'

/** @import { Step } from '@defra/lis-infra-ui-services/journey' */
/** @import { DraftDeath } from '#server/services/be4fe/animal.js' */
/** @import { HoldingAnimal } from '#server/services/be4fe/data.js' */

/**
 * @typedef {object} Options - what the rules need beyond the animal
 * @property {HoldingAnimal[]} holdingCattle - the cattle on the holding
 * @property {string[]} reportedEarTags - the ids, so ear tag numbers, of the
 *   report's other animals
 * @property {string[]} unusedEarTags - the ear tags issued to the holding
 *   that are not on an animal, nor on another animal of the report
 */

/** @type {Step<DraftDeath, Options>[]} */
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
    schema: registeredAnimalDetailsSchema,
    context: ({ holdingCattle, reportedEarTags }) => ({
      holdingCattle,
      reportedEarTags
    }),
    appliesTo: (death) => death.isRegistered === REGISTERED
  },
  {
    page: 'unregistered-animal-details',
    schema: unregisteredAnimalDetailsSchema,
    // An animal keeps the ear tag it has: the unused ones leave it out
    context: ({ unusedEarTags }, saved) => ({
      availableEarTags: [...unusedEarTags, saved.earTagNumber ?? '']
    }),
    appliesTo: (death) => death.isRegistered === UNREGISTERED
  }
]

export const deathReport = createJourney(steps)
