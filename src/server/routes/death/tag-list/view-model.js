import { formatEarTag } from '@defra/lis-infra-ui-services/nunjucks/filters'

import { animalPagePath, newAnimalPath, submissionPath } from '../paths.js'
import { getMessage } from './messages.js'

const PAGE_TITLE = 'Report cattle deaths'

/**
 * @typedef {object} ListedAnimal
 * @property {string} animalId
 * @property {string} earTagNumber - as saved
 * @property {string} page - where its row links to
 * @property {boolean} isReady - whether it is ready to send
 */

/**
 * @param {object} options
 * @param {object} options.request
 * @param {ListedAnimal[]} options.animals - in the order they were last saved
 * @param {string} [options.addAnother]
 * @param {{ field: string, code: string }[]} [options.errors]
 * @returns {object} the tag list view model
 */
export function buildViewModel({
  request,
  animals,
  addAnother = '',
  errors = []
}) {
  const { cph, submissionId } = request.params
  const items = animals.map(({ animalId, earTagNumber, page, isReady }) => ({
    id: `animal-${animalId}`,
    earTagNumber: formatEarTag(earTagNumber),
    href: animalPagePath(cph, submissionId, animalId, page),
    isReady
  }))
  const firstNotReady = items.find((item) => !item.isReady)
  // The incomplete error is about an animal, not a field on this page, so it
  // links to the row link of the first animal to complete.
  const hrefOf = ({ field }) =>
    field === 'animals' ? `#${firstNotReady.id}` : `#${field}`

  return {
    pageTitle: errors.length ? `Error: ${PAGE_TITLE}` : PAGE_TITLE,
    heading: PAGE_TITLE,
    // With no animals, back to where the first is added.
    backLinkHref:
      items.at(-1)?.href ?? newAnimalPath(cph, submissionId, 'is-registered'),
    formAction: submissionPath(cph, submissionId),
    animals: items,
    values: { addAnother },
    errorList: errors.map((error) => ({
      text: getMessage(error),
      href: hrefOf(error)
    })),
    fieldErrors: Object.fromEntries(
      errors.map((error) => [error.field, { text: getMessage(error) }])
    )
  }
}
