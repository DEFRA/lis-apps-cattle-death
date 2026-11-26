/*
 * The cattle-death backend-for-frontend (BE4FE) holds each holding's unsent
 * death report (its "submission") and the animals in it, and knows the
 * holding's cattle and ear tags. It stores whatever it is given: each page
 * validates its answers before asking for a save.
 */
import Boom from '@hapi/boom'
import { createSubmissionClient } from '@defra/lis-hubs-infra-core'

import { config } from '#config/config.js'

// The compose stack publishes the BE4FE on this port (lis-dev
// .tools/compose/cattle-death.yml), so a sideloaded app reaches it there.
const localPort = 8086

const NOT_FOUND = 404

/**
 * @typedef {object} ReportKey - a holding's death report
 * @property {string} cph - the holding, as 12/345/6789
 * @property {string} submissionId
 */

// The BE4FE's submission endpoints, and the service client's own verbs
export const submissions = createSubmissionClient({
  environment: config.get('environment'),
  serviceName: 'lis-be4fe-cattle-death',
  port: localPort,
  apiKey: config.get('cattleDeathApi.apiKey'),
  timeout: config.get('cattleDeathApi.timeout'),
  circuitBreaker: config.get('cattleDeathApi.circuitBreaker')
})

/**
 * A page about something the BE4FE does not hold is a page that does not
 * exist.
 * @template T
 * @param {Promise<T>} call - a call to the BE4FE
 * @returns {Promise<T>} its answer
 * @throws {Boom.Boom} not found, for a call the BE4FE answers not found
 */
async function notFoundAsBoom(call) {
  try {
    return await call
  } catch (error) {
    if (error.statusCode === NOT_FOUND) {
      throw Boom.notFound()
    }

    throw error
  }
}

// Every data call to the BE4FE is made through here
export const be4fe = {
  /**
   * @param {string} path
   * @returns {Promise<{ payload: any }>} the BE4FE's answer
   */
  get: (path) => notFoundAsBoom(submissions.get(path))
}

/**
 * @param {string} cph - as 12/345/6789
 * @returns {string} the holding's CPH, each part encoded for a path
 */
function encodeCph(cph) {
  return cph.split('/').map(encodeURIComponent).join('/')
}

/**
 * @param {string} cph - as 12/345/6789
 * @returns {string} the path of what the BE4FE knows of the holding
 */
export function holdingDataPath(cph) {
  return `data/${encodeCph(cph)}`
}

/**
 * @param {string} cph - as 12/345/6789
 * @returns {string} the path of the holding's ear tags
 */
export function earTagsPath(cph) {
  return `${holdingDataPath(cph)}/ear-tags`
}
