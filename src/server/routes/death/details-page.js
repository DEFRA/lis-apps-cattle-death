import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'
import { trimAnswers } from '@defra/lis-infra-ui-services/journey'

import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import { deathReport } from '#server/journeys/death/report.js'
import {
  animalsBeforeNew,
  answersOf,
  asBranch,
  isFull
} from './animal-answers.js'
import { pathAfterSave } from './check-return.js'
import { submissionPath } from './paths.js'
import { reportOf } from './report-key.js'

/** @import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi' */
/** @import { Options } from '#server/journeys/death/report.js' */
/** @import { DraftDeath } from '#server/services/temporary-be4fe/animal.js' */

/**
 * What differs between the registered and unregistered animal details
 * pages; what they do with it is the same.
 * @typedef {object} DetailsPage
 * @property {string} page - the journey page
 * @property {string} template
 * @property {string} isRegistered - the branch of the journey the page is on
 * @property {(answers: object) => object} formValuesFrom - each field's
 *   answer, blank when absent
 * @property {(request: Request) => Promise<Options>} rulesContext - what the
 *   page's rules are judged against
 * @property {(context: Options, animal: DraftDeath) => string[]} earTagItemsFrom
 *   - the ear tags to suggest
 * @property {(options: { request: Request, values: object, earTagItems: string[], errors?: object[] }) => object} buildViewModel
 */

/**
 * The animal as the page has it, with what its rules are judged against;
 * nothing for a new animal the report has no room for.
 * @param {DetailsPage} details
 * @param {Request} request
 * @returns {Promise<{ animal: DraftDeath, context: Options } | undefined>}
 */
async function animalOnPage(details, request) {
  const [death, context, animalsBefore] = await Promise.all([
    answersOf(request),
    details.rulesContext(request),
    animalsBeforeNew(request)
  ])

  return isFull(animalsBefore)
    ? undefined
    : { animal: asBranch(death, details.isRegistered), context }
}

/**
 * Shows an animal details page.
 * @param {DetailsPage} details
 * @param {Request} request
 * @param {ResponseToolkit} h
 * @returns {Promise<ResponseObject>}
 */
export async function showDetails(details, request, h) {
  const { cph, submissionId } = request.params
  const onPage = await animalOnPage(details, request)

  if (!onPage) {
    return h.redirect(submissionPath(cph, submissionId))
  }

  const { animal, context } = onPage

  return h.view(
    details.template,
    details.buildViewModel({
      request,
      values: details.formValuesFrom(animal),
      earTagItems: details.earTagItemsFrom(context, animal)
    })
  )
}

/**
 * Saves an animal details page's answers, or shows the page again with what
 * is wrong with them.
 * @param {DetailsPage} details
 * @param {Request} request
 * @param {ResponseToolkit} h
 * @returns {Promise<ResponseObject>}
 */
export async function saveDetails(details, request, h) {
  const { cph, submissionId } = request.params
  const values = trimAnswers(details.formValuesFrom(request.payload))
  const onPage = await animalOnPage(details, request)

  if (!onPage) {
    return h.redirect(submissionPath(cph, submissionId))
  }

  const { animal, context } = onPage
  const { errors } = deathReport.validateStep(
    details.page,
    animal,
    values,
    context
  )

  if (errors.length) {
    return h
      .view(
        details.template,
        details.buildViewModel({
          request,
          values,
          earTagItems: details.earTagItemsFrom(context, animal),
          errors
        })
      )
      .code(statusCodes.badRequest)
  }

  const saved = deathReport.withAnswers(details.page, animal, values)
  // The animal's id follows its ear tag number, so it is the saved
  // animal's id that the next page is about
  const { animalId } = await animalClient.saveAnimal({
    ...reportOf(request),
    animalId: request.params.animalId,
    values: saved
  })
  const savedAnimal = {
    ...request,
    params: { ...request.params, animalId }
  }

  return h.redirect(pathAfterSave(savedAnimal, details.page, saved))
}
