const MESSAGES = {
  isRegistered: {
    required:
      'Select if the animal is registered on your holding or not to continue'
  }
}

/**
 * The text shown to the user for a validation result from the death report's
 * rules. Throws on an unknown field or code so a new rule cannot reach the
 * page without wording.
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
