import * as dataClient from '#server/services/temporary-be4fe/data.js'
import { UNREGISTERED } from '#server/journeys/death/is-registered.js'
import { saveDetails, showDetails } from '../details-page.js'
import { reportOf } from '../report-key.js'
import {
  buildViewModel,
  formValuesFrom,
  UNREGISTERED_DETAILS_PAGE
} from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */
/** @import { Options } from '#server/journeys/death/report.js' */
/** @import { DraftDeath } from '#server/services/temporary-be4fe/animal.js' */
/** @import { DetailsPage } from '../details-page.js' */

/**
 * @param {Request} request
 * @returns {Promise<Pick<Options, 'unusedEarTags'>>} what the page's rules
 *   are judged against
 */
async function rulesContext(request) {
  return {
    unusedEarTags: await dataClient.getUnusedEarTags(reportOf(request))
  }
}

/**
 * @param {Pick<Options, 'unusedEarTags'>} context
 * @param {DraftDeath} animal - as the page has it
 * @returns {string[]} the ear tags to suggest: the holding's unused ones,
 *   and the one the animal already has
 */
function earTagItemsFrom({ unusedEarTags }, animal) {
  return animal.earTagNumber
    ? [animal.earTagNumber, ...unusedEarTags]
    : unusedEarTags
}

/** @type {DetailsPage} */
const details = {
  page: UNREGISTERED_DETAILS_PAGE,
  template: 'death/unregistered-animal-details/index',
  isRegistered: UNREGISTERED,
  formValuesFrom,
  rulesContext,
  earTagItemsFrom,
  buildViewModel
}

export const unregisteredAnimalDetailsController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  handler(request, h) {
    return showDetails(details, request, h)
  }
}

export const unregisteredAnimalDetailsSubmitController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  handler(request, h) {
    return saveDetails(details, request, h)
  }
}
