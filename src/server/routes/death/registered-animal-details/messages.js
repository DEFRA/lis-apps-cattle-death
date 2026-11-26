const MESSAGES = {
  earTagNumber: {
    required:
      'Enter all or part of the animal ear tag number you are reporting',
    notOnHolding:
      'This animal does not appear to be registered to your holding. If you believe this is incorrect, contact BCMS',
    alreadyReported:
      'This animal ear tag number has already been added to this report'
  },
  dateOfDeath: {
    required: 'Enter the date the animal died',
    invalid: 'Date of death must be a real date, for example 01/05/2026',
    future: 'Date of death needs to be in the past'
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
