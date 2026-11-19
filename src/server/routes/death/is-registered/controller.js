import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'
import { trimAnswers } from '@defra/lis-infra-ui-services/journey'

import { deathReport } from '#server/journeys/death/report.js'
import { animalsBeforeNew, answersOf, isFull } from '../animal-answers.js'
import { CHECK_PAGE, isReturningToCheck, keepReturn } from '../check-return.js'
import { animalPagePath, newAnimalPath, submissionPath } from '../paths.js'
import {
  buildViewModel,
  formValuesFrom,
  IS_REGISTERED_PAGE
} from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */
/** @import { DraftDeath } from '#server/services/temporary-be4fe/animal.js' */

const TEMPLATE = 'death/is-registered/index'

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
    const { cph, submissionId } = request.params
    const [death, animalsBefore] = await Promise.all([
      answersOf(request),
      animalsBeforeNew(request)
    ])

    if (isFull(animalsBefore)) {
      return h.redirect(submissionPath(cph, submissionId))
    }

    return h.view(
      TEMPLATE,
      buildViewModel({
        request,
        values: formValuesFrom(death),
        isFirstAnimal: animalsBefore === 0
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
    const { cph, submissionId } = request.params
    const values = trimAnswers(formValuesFrom(request.payload))
    const [death, animalsBefore] = await Promise.all([
      answersOf(request),
      animalsBeforeNew(request)
    ])

    if (isFull(animalsBefore)) {
      return h.redirect(submissionPath(cph, submissionId))
    }

    const { errors } = deathReport.validateStep(
      IS_REGISTERED_PAGE,
      death,
      values
    )

    if (errors.length) {
      return h
        .view(
          TEMPLATE,
          buildViewModel({
            request,
            values,
            errors,
            isFirstAnimal: animalsBefore === 0
          })
        )
        .code(statusCodes.badRequest)
    }

    const answered = deathReport.withAnswers(IS_REGISTERED_PAGE, death, values)

    return h.redirect(pathAfterAnswer(request, death, answered))
  }
}
