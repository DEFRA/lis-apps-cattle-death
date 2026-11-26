import { buildViewModel } from './view-model.js'

const ANIMAL_PATH =
  '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/animals/UK123456401560'
const request = {
  params: {
    cph: '10/081/1234',
    submissionId: '7ZK-M3Q-A9D',
    animalId: 'UK123456401560'
  }
}

/**
 * @param {object} row - a summary list row
 * @returns {string[]} its key, value and Change link
 */
function shown(row) {
  return [row.key.text, row.value.text, row.actions.items[0].href]
}

describe('check animal details view model', () => {
  test('it lists a registered animal: registered, ear tag and date of death, each linked to its field', () => {
    // Arrange
    const death = {
      isRegistered: 'yes',
      earTagNumber: 'UK123456401560',
      dateOfDeath: '1/11/2026'
    }

    // Act
    const model = buildViewModel({ request, death })

    // Assert
    const details = `${ANIMAL_PATH}/registered-animal-details?return=check`
    expect(model.rows.map(shown)).toEqual([
      [
        'Animal registered on holding',
        'Yes',
        `${ANIMAL_PATH}/is-registered?return=check#isRegistered`
      ],
      ['Animal ear tag number', 'UK 123456 401560', `${details}#earTagNumber`],
      ['Date of death', '1 November 2026', `${details}#dateOfDeath`]
    ])
    expect(model.backLinkHref).toBe(`${ANIMAL_PATH}/registered-animal-details`)
  })

  test('it lists an unregistered animal with its birth details too', () => {
    // Arrange
    const death = {
      isRegistered: 'no',
      earTagNumber: 'UK123456401560',
      dateOfBirth: '1/10/2026',
      dateOfDeath: '1/11/2026',
      sex: 'female',
      breed: 'AA'
    }

    // Act
    const model = buildViewModel({ request, death })

    // Assert
    const details = `${ANIMAL_PATH}/unregistered-animal-details?return=check`
    expect(model.rows.map(shown)).toEqual([
      [
        'Animal registered on holding',
        'No',
        `${ANIMAL_PATH}/is-registered?return=check#isRegistered`
      ],
      ['Animal ear tag number', 'UK 123456 401560', `${details}#earTagNumber`],
      ['Date of birth', '1 October 2026', `${details}#dateOfBirth`],
      ['Date of death', '1 November 2026', `${details}#dateOfDeath`],
      ['Sex', 'Female', `${details}#sex`],
      ['Breed', 'Aberdeen Angus (AA)', `${details}#breed`]
    ])
    expect(model.backLinkHref).toBe(
      `${ANIMAL_PATH}/unregistered-animal-details`
    )
  })

  test('it gives the page title, a Change link for screen readers and its own form action', () => {
    // Arrange
    const death = {
      isRegistered: 'no',
      earTagNumber: 'UK123456401560',
      dateOfBirth: '1/10/2026',
      dateOfDeath: '1/11/2026',
      sex: 'male',
      breed: 'ZZZ'
    }

    // Act
    const model = buildViewModel({ request, death })

    // Assert
    expect(model.pageTitle).toBe('Check animal details')
    expect(model.heading).toBe('Check animal details')
    expect(model.formAction).toBe(`${ANIMAL_PATH}/check-animal-details`)
    expect(model.rows[0].actions.items[0]).toEqual(
      expect.objectContaining({
        text: 'Change',
        visuallyHiddenText: 'whether the animal is registered on holding'
      })
    )
    expect(model.rows.at(-1).value.text).toBe('ZZZ')
  })
})
