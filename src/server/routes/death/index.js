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

const ANIMALS_ROUTE = `${DEATH_ROUTE}/{submissionId}/animals`
const ANIMAL_ROUTE = `${ANIMALS_ROUTE}/{animalId}`

// An animal has no id until its details, and so its ear tag number, are
// saved
const newAnimalRoutes = [
  {
    method: 'GET',
    path: `${ANIMALS_ROUTE}/is-registered`,
    ...isRegisteredController,
    options: {
      validate: submissionParams,
      pre: [{ method: demandDeathAccess }]
    }
  },
  {
    method: 'POST',
    path: `${ANIMALS_ROUTE}/is-registered`,
    ...isRegisteredSubmitController,
    options: {
      validate: {
        ...submissionParams,
        payload: isRegisteredPayload
      },
      pre: [{ method: demandDeathAccess }]
    }
  }
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
  {
    method: 'GET',
    path: `${ANIMAL_ROUTE}/is-registered`,
    ...isRegisteredController,
    options: {
      validate: animalParams,
      pre: [{ method: demandDeathAccess }]
    }
  },
  {
    method: 'POST',
    path: `${ANIMAL_ROUTE}/is-registered`,
    ...isRegisteredSubmitController,
    options: {
      validate: {
        ...animalParams,
        payload: isRegisteredPayload
      },
      pre: [{ method: demandDeathAccess }]
    }
  }
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
