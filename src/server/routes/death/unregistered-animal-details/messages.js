const EAR_TAG_MESSAGE = 'Enter the animal ear tag number you are reporting'
const BREED_MESSAGE =
  'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'

const MESSAGES = {
  // A tag that is not one the holding can give the animal is worded as a
  // missing one, as the page only offers those.
  earTagNumber: {
    required: EAR_TAG_MESSAGE,
    notAvailable: EAR_TAG_MESSAGE,
    alreadyReported:
      'This animal ear tag number has already been added to this report'
  },
  dateOfBirth: {
    required: 'Enter the date the animal was born',
    invalid: 'Date of birth must be a real date, for example 01/05/2026',
    future: 'Date of birth must be in the past'
  },
  dateOfDeath: {
    required: 'Enter the date the animal died',
    invalid: 'Date of death must be a real date, for example 01/05/2026',
    future: 'Date of death needs to be in the past',
    beforeBirth: 'Date of death cannot be before the date of birth'
  },
  sex: {
    required: 'Select if the animal is male or female'
  },
  breed: {
    required: BREED_MESSAGE,
    unknown: BREED_MESSAGE
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
