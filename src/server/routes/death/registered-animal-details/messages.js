const ALREADY_REPORTED = 'A death has already been reported for this animal'

const MESSAGES = {
  earTagNumber: {
    required: 'Enter the animal ear tag number',
    notOnHolding:
      'This animal does not appear to be registered to your holding. If you believe this is incorrect, contact BCMS',
    // An animal already in this report has its death reported in it
    alreadyReported: ALREADY_REPORTED
  },
  dateOfDeath: {
    required: 'Enter the date of death',
    invalid: 'Date of death must be a real date, for example 01/05/2026',
    future: 'The date of death cannot be in the future'
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
