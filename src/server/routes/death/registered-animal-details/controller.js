import { plainEarTag } from '#server/common/helpers/ear-tag.js'
import * as dataClient from '#server/services/temporary-be4fe/data.js'
import { ALIVE } from '#server/services/temporary-be4fe/holdings.js'
import { REGISTERED } from '#server/journeys/death/is-registered.js'
import { reportedEarTagsOf } from '../animal-answers.js'
import { saveDetails, showDetails } from '../details-page.js'
import {
  buildViewModel,
  formValuesFrom,
  REGISTERED_DETAILS_PAGE
} from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */
/** @import { Options } from '#server/journeys/death/report.js' */
/** @import { DetailsPage } from '../details-page.js' */

/**
 * @param {Request} request
 * @returns {Promise<Options>} what the page's rules are judged against
 */
async function rulesContext(request) {
  const [holdingCattle, reportedEarTags] = await Promise.all([
    dataClient.getHoldingCattle({ cph: request.params.cph }),
    reportedEarTagsOf(request)
  ])

  return { holdingCattle, reportedEarTags }
}

/**
 * @param {Options} context
 * @returns {string[]} the ear tags to suggest: the holding's living cattle
 *   not already in the report
 */
function earTagItemsFrom({ holdingCattle, reportedEarTags }) {
  return holdingCattle
    .filter(({ status }) => status === ALIVE)
    .map(({ earTagNumber }) => earTagNumber)
    .filter(
      (earTagNumber) => !reportedEarTags.includes(plainEarTag(earTagNumber))
    )
}

/** @type {DetailsPage} */
const details = {
  page: REGISTERED_DETAILS_PAGE,
  template: 'death/registered-animal-details/index',
  isRegistered: REGISTERED,
  formValuesFrom,
  rulesContext,
  earTagItemsFrom,
  buildViewModel
}

export const registeredAnimalDetailsController = {
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

export const registeredAnimalDetailsSubmitController = {
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
