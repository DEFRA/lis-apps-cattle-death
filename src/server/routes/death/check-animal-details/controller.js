import * as animalClient from '#server/services/be4fe/animal.js'
import * as dataClient from '#server/services/be4fe/data.js'
import { deathReport } from '#server/journeys/death/report.js'
import { reportedEarTagsOf } from '../animal-answers.js'
import { withReturnToCheck } from '../check-return.js'
import { animalPagePath, submissionPath } from '../paths.js'
import { animalOf, reportOf } from '../report-key.js'
import { buildViewModel } from './view-model.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */

const TEMPLATE = 'death/check-animal-details/index'

export const checkAnimalDetailsController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const { cph, submissionId, animalId } = request.params
    const death = await animalClient.getAnimal(animalOf(request))
    const unanswered = deathReport.firstUnansweredPage(death)

    if (unanswered) {
      return h.redirect(animalPagePath(cph, submissionId, animalId, unanswered))
    }

    return h.view(TEMPLATE, buildViewModel({ request, death }))
  }
}

export const checkAnimalDetailsSubmitController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const { cph, submissionId, animalId } = request.params
    const [death, holdingCattle, unusedEarTags, reportedEarTags] =
      await Promise.all([
        animalClient.getAnimal(animalOf(request)),
        dataClient.getHoldingCattle({ cph }),
        dataClient.getUnusedEarTags(reportOf(request)),
        reportedEarTagsOf(request)
      ])
    // Every answer was valid when it was saved, but the holding's cattle and
    // ear tags may have changed since, so the animal is judged whole here.
    const incomplete = deathReport.firstIncompleteStep(death, {
      holdingCattle,
      unusedEarTags,
      reportedEarTags
    })

    if (incomplete) {
      return h.redirect(
        withReturnToCheck(
          animalPagePath(cph, submissionId, animalId, incomplete.page)
        )
      )
    }

    return h.redirect(submissionPath(cph, submissionId))
  }
}
