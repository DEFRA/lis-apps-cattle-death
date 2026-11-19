import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'
import { trimAnswers } from '@defra/lis-infra-ui-services/journey'

import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import { deathReport } from '#server/journeys/death/report.js'
import { CHECK_PAGE, isReturningToCheck, keepReturn } from '../check-return.js'
import { animalPagePath, newAnimalPath } from '../paths.js'
import { animalOf, reportOf } from '../report-key.js'
import {
  buildViewModel,
  formValuesFrom,
  IS_REGISTERED_PAGE
} from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */
/** @import { DraftDeath } from '#server/services/temporary-be4fe/animal.js' */

const TEMPLATE = 'death/is-registered/index'

/**
 * @param {Request} request
 * @returns {Promise<DraftDeath>} the animal's answers: none for a new animal
 * @throws {Error} not found, for an id the report has no animal under
 */
async function answersOf(request) {
  if (request.params.animalId === undefined) {
    return {}
  }

  return animalClient.getAnimal(animalOf(request))
}

/**
 * @param {Request} request
 * @returns {Promise<boolean>} whether the animal is a new one in a report
 *   with none, where the report starts
 */
async function isFirstAnimal(request) {
  if (request.params.animalId !== undefined) {
    return false
  }

  const { animals } = await submissionClient.getSubmission(reportOf(request))

  return animals.length === 0
}

/**
 * Nothing is saved here: an animal is saved with its details, so the answer
 * is carried by which details page comes next, which saves it. A saved
 * animal answered as it was goes back to check animal details after a Change
 * link.
 * @param {Request} request
 * @param {DraftDeath} death - the animal as saved
 * @param {DraftDeath} answered - the animal with the page's answer
 * @returns {string} the path to redirect to
 */
function pathAfterAnswer(request, death, answered) {
  const { cph, submissionId, animalId } = request.params
  const detailsPage = deathReport.nextPage(IS_REGISTERED_PAGE, answered)

  if (animalId === undefined) {
    return newAnimalPath(cph, submissionId, detailsPage)
  }

  if (
    isReturningToCheck(request) &&
    death.isRegistered === answered.isRegistered
  ) {
    return animalPagePath(cph, submissionId, animalId, CHECK_PAGE)
  }

  return keepReturn(
    request,
    animalPagePath(cph, submissionId, animalId, detailsPage)
  )
}

export const isRegisteredController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const [death, isFirst] = await Promise.all([
      answersOf(request),
      isFirstAnimal(request)
    ])

    return h.view(
      TEMPLATE,
      buildViewModel({
        request,
        values: formValuesFrom(death),
        isFirstAnimal: isFirst
      })
    )
  }
}

export const isRegisteredSubmitController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const values = trimAnswers(formValuesFrom(request.payload))
    const [death, isFirst] = await Promise.all([
      answersOf(request),
      isFirstAnimal(request)
    ])
    const { errors } = deathReport.validateStep(
      IS_REGISTERED_PAGE,
      death,
      values
    )

    if (errors.length) {
      return h
        .view(
          TEMPLATE,
          buildViewModel({ request, values, errors, isFirstAnimal: isFirst })
        )
        .code(statusCodes.badRequest)
    }

    const answered = deathReport.withAnswers(IS_REGISTERED_PAGE, death, values)

    return h.redirect(pathAfterAnswer(request, death, answered))
  }
}
