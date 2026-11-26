import Boom from '@hapi/boom'
import Joi from 'joi'

import { DEATH_ROUTE } from './paths.js'
import { echoed } from './form-limits.js'
import { demandDeathAccess } from './holding-access.js'
import { startReportController } from './start/controller.js'
import {
  isRegisteredController,
  isRegisteredSubmitController
} from './is-registered/controller.js'
import {
  registeredAnimalDetailsController,
  registeredAnimalDetailsSubmitController
} from './registered-animal-details/controller.js'
import {
  unregisteredAnimalDetailsController,
  unregisteredAnimalDetailsSubmitController
} from './unregistered-animal-details/controller.js'
import {
  checkAnimalDetailsController,
  checkAnimalDetailsSubmitController
} from './check-animal-details/controller.js'
import {
  tagListController,
  tagListSubmitController
} from './tag-list/controller.js'

/** @import { Server } from '@hapi/hapi' */

const cph = Joi.string()
  .pattern(/^\d{2}\/\d{3}\/\d{4}$/)
  .required()

// The BE4FE's submission id: three groups of three Crockford base32
// characters, which it reads case-insensitively
const submissionId = Joi.string()
  .pattern(
    /^[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$/i
  )
  .required()

/**
 * A malformed path parameter is a page that does not exist; a malformed
 * form post (a field sent twice) is a bad request.
 * @param {object} _request
 * @param {object} _h
 * @param {Error & { output?: object }} error
 * @returns {never}
 */
function failValidation(_request, _h, error) {
  if (error.output?.payload?.validation?.source === 'payload') {
    throw Boom.badRequest()
  }

  throw Boom.notFound()
}

const holdingParams = {
  params: Joi.object({ cph }),
  failAction: failValidation
}

const submissionParams = {
  params: Joi.object({ cph, submissionId }),
  failAction: failValidation
}

const animalParams = {
  params: Joi.object({
    cph,
    submissionId,
    // An animal's id is its ear tag number, as the BE4FE lists them: letters
    // and digits
    animalId: Joi.string()
      .pattern(/^[0-9A-Z]{1,20}$/i)
      .required()
  }),
  failAction: failValidation
}

// An answer too long to show again is taken as not given, so its page asks
// for it and nothing is looked up by it
const formField = Joi.string().allow('').default('').custom(echoed)

const isRegisteredPayload = Joi.object({
  isRegistered: formField
}).options({ stripUnknown: true })

const registeredDetailsPayload = Joi.object({
  earTagNumber: formField,
  dateOfDeath: formField
}).options({ stripUnknown: true })

const tagListPayload = Joi.object({
  addAnother: formField
}).options({ stripUnknown: true })

const unregisteredDetailsPayload = Joi.object({
  earTagNumber: formField,
  dateOfBirth: formField,
  dateOfDeath: formField,
  sex: formField,
  breed: formField
}).options({ stripUnknown: true })

/**
 * @param {string} path
 * @param {object} params - the route's params validation
 * @param {object} controller - the page's GET controller
 * @param {object} submitController - the page's POST controller
 * @param {object} payload - the page's form validation
 * @returns {object[]} the page's GET and POST routes
 */
function pageRoutes(path, params, controller, submitController, payload) {
  return [
    {
      method: 'GET',
      path,
      ...controller,
      options: {
        validate: params,
        pre: [{ method: demandDeathAccess }]
      }
    },
    {
      method: 'POST',
      path,
      ...submitController,
      options: {
        validate: { ...params, payload },
        pre: [{ method: demandDeathAccess }]
      }
    }
  ]
}

const ANIMALS_ROUTE = `${DEATH_ROUTE}/{submissionId}/animals`
const ANIMAL_ROUTE = `${ANIMALS_ROUTE}/{animalId}`

// An animal has no id until its details, and so its ear tag number, are
// saved
const newAnimalRoutes = [
  ...pageRoutes(
    `${ANIMALS_ROUTE}/is-registered`,
    submissionParams,
    isRegisteredController,
    isRegisteredSubmitController,
    isRegisteredPayload
  ),
  ...pageRoutes(
    `${ANIMALS_ROUTE}/registered-animal-details`,
    submissionParams,
    registeredAnimalDetailsController,
    registeredAnimalDetailsSubmitController,
    registeredDetailsPayload
  ),
  ...pageRoutes(
    `${ANIMALS_ROUTE}/unregistered-animal-details`,
    submissionParams,
    unregisteredAnimalDetailsController,
    unregisteredAnimalDetailsSubmitController,
    unregisteredDetailsPayload
  )
]

const routes = [
  {
    method: 'GET',
    path: DEATH_ROUTE,
    ...startReportController,
    options: {
      validate: holdingParams,
      pre: [{ method: demandDeathAccess }]
    }
  },
  ...newAnimalRoutes,
  ...pageRoutes(
    `${ANIMAL_ROUTE}/is-registered`,
    animalParams,
    isRegisteredController,
    isRegisteredSubmitController,
    isRegisteredPayload
  ),
  ...pageRoutes(
    `${ANIMAL_ROUTE}/registered-animal-details`,
    animalParams,
    registeredAnimalDetailsController,
    registeredAnimalDetailsSubmitController,
    registeredDetailsPayload
  ),
  ...pageRoutes(
    `${ANIMAL_ROUTE}/unregistered-animal-details`,
    animalParams,
    unregisteredAnimalDetailsController,
    unregisteredAnimalDetailsSubmitController,
    unregisteredDetailsPayload
  ),
  {
    method: 'GET',
    path: `${ANIMAL_ROUTE}/check-animal-details`,
    ...checkAnimalDetailsController,
    options: {
      validate: animalParams,
      pre: [{ method: demandDeathAccess }]
    }
  },
  {
    method: 'POST',
    path: `${ANIMAL_ROUTE}/check-animal-details`,
    ...checkAnimalDetailsSubmitController,
    options: {
      validate: animalParams,
      pre: [{ method: demandDeathAccess }]
    }
  },
  ...pageRoutes(
    `${DEATH_ROUTE}/{submissionId}`,
    submissionParams,
    tagListController,
    tagListSubmitController,
    tagListPayload
  )
]

export const death = {
  plugin: {
    name: 'death',
    /**
     * Registers the routes with the server.
     *
     * @param {Server} server - the Hapi server
     */
    register(server) {
      server.route(routes)
    }
  }
}
