export const MAX_ANIMALS = 50

const MESSAGES = {
  addAnother: {
    required: 'Select yes to report more deaths, or no to continue',
    noAnimals: 'Add at least one animal before continuing',
    tooMany: `You can add up to ${MAX_ANIMALS} animals to one report. Select no to continue`
  },
  animals: {
    incomplete: 'Complete all required animal details before continuing'
  }
}

/**
 * The text shown to the user for a problem with the list of animals. Throws
 * on an unknown field or code so a new rule cannot reach the page without
 * wording.
 * @param {{ field: string, code: string }} result
 * @returns {string}
 */
export function getMessage({ field, code }) {
  if (
    !Object.hasOwn(MESSAGES, field) ||
    !Object.hasOwn(MESSAGES[field], code)
  ) {
    throw new Error(`No message for ${field} ${code}`)
  }

  return MESSAGES[field][code]
}
