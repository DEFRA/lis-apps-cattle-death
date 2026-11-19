import { deathReport } from './report.js'

describe('deathReport', () => {
  test.each([
    ['yes', 'registered-animal-details'],
    ['no', 'unregistered-animal-details']
  ])(
    'it goes from is-registered answered %s to its details page',
    (isRegistered, expected) => {
      // Arrange
      const death = { isRegistered }

      // Act
      const page = deathReport.nextPage('is-registered', death)

      // Assert
      expect(page).toBe(expected)
    }
  )

  test('it asks first whether an animal with no answers is registered', () => {
    // Arrange
    const death = {}

    // Act
    const page = deathReport.firstUnansweredPage(death)

    // Assert
    expect(page).toBe('is-registered')
  })

  test("a changed answer clears the animal's details, but keeps its date of death", () => {
    // Arrange
    const death = {
      isRegistered: 'no',
      earTagNumber: 'UK123456401560',
      dateOfBirth: '1/11/2026',
      dateOfDeath: '2/11/2026',
      sex: 'male',
      breed: 'AA'
    }

    // Act
    const answered = deathReport.withAnswers('is-registered', death, {
      isRegistered: 'yes'
    })

    // Assert
    expect(answered).toEqual({ isRegistered: 'yes', dateOfDeath: '2/11/2026' })
  })

  test('the same answer keeps every detail', () => {
    // Arrange
    const death = {
      isRegistered: 'yes',
      earTagNumber: 'UK123456301550',
      dateOfDeath: '2/11/2026'
    }

    // Act
    const answered = deathReport.withAnswers('is-registered', death, {
      isRegistered: 'yes'
    })

    // Assert
    expect(answered).toEqual(death)
  })
})
