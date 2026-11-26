import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'

import * as animalClient from '#server/services/be4fe/animal.js'
import * as submissionClient from '#server/services/be4fe/submission.js'
import * as dataClient from '#server/services/be4fe/data.js'
import { deathReport } from '#server/journeys/death/report.js'
import { newAnimalPath, submissionPagePath } from '../paths.js'
import { reportOf } from '../report-key.js'
import { SUBMIT_PAGE } from '../submit/view-model.js'
import { MAX_ANIMALS } from './messages.js'
import { buildViewModel } from './view-model.js'

/**
 * @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi'
 * @import { ListedAnimal } from './view-model.js'
 * @import { ReportKey } from '#server/services/be4fe/client.js'
 */

const TEMPLATE = 'death/tag-list/index'

/**
 * Each animal is judged whole against the holding's cattle and ear tags as
 * they are now: an animal is ready to send when every page it goes through
 * is answered and still holds.
 * @param {ReportKey} report
 * @returns {Promise<ListedAnimal[]>} the report's animals, in the order
 *   they were last saved
 */
export async function listAnimals(report) {
  const [submission, holdingCattle, unusedEarTags] = await Promise.all([
    submissionClient.getSubmission(report),
    dataClient.getHoldingCattle({ cph: report.cph }),
    dataClient.getUnusedEarTags(report)
  ])
  const ids = submission.animals.map(({ animalId }) => animalId)
  const deaths = await Promise.all(
    ids.map((animalId) => animalClient.getAnimal({ ...report, animalId }))
  )

  return ids.map((animalId, index) => {
    const incomplete = deathReport.firstIncompleteStep(deaths[index], {
      holdingCattle,
      unusedEarTags,
      reportedEarTags: ids.filter((other) => other !== animalId)
    })

    return {
      animalId,
      earTagNumber: deaths[index].earTagNumber,
      isReady: !incomplete
    }
  })
}

/**
 * @param {string} addAnother - the answer to "Add more animals"
 * @param {ListedAnimal[]} animals
 * @returns {{ field: string, code: string }[]}
 */
function validate(addAnother, animals) {
  if (addAnother === 'yes') {
    return animals.length < MAX_ANIMALS
      ? []
      : [{ field: 'addAnother', code: 'tooMany' }]
  }

  if (addAnother === 'no' && !animals.length) {
    return [{ field: 'addAnother', code: 'noAnimals' }]
  }

  if (addAnother === 'no') {
    return animals.every((animal) => animal.isReady)
      ? []
      : [{ field: 'animals', code: 'incomplete' }]
  }

  return [{ field: 'addAnother', code: 'required' }]
}

export const tagListController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const animals = await listAnimals(reportOf(request))

    return h.view(TEMPLATE, buildViewModel({ request, animals }))
  }
}

export const tagListSubmitController = {
  /**
   * Handles the request and returns the response.
   *
   * @param {Request} request - the Hapi request
   * @param {ResponseToolkit} h - the Hapi response toolkit
   * @returns {Promise<ResponseObject>} the response
   */
  async handler(request, h) {
    const { cph, submissionId } = request.params
    const { addAnother } = request.payload
    const animals = await listAnimals(reportOf(request))
    const errors = validate(addAnother, animals)

    if (errors.length) {
      return h
        .view(
          TEMPLATE,
          buildViewModel({ request, animals, addAnother, errors })
        )
        .code(statusCodes.badRequest)
    }

    if (addAnother === 'yes') {
      return h.redirect(newAnimalPath(cph, submissionId, 'is-registered'))
    }

    return h.redirect(submissionPagePath(cph, submissionId, SUBMIT_PAGE))
  }
}
