import { buildViewModel } from './view-model.js'

const request = { params: { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' } }

describe('death report sent view model', () => {
  test.each([
    [1, '1 death reported', 'report', 'report has'],
    [2, '2 deaths reported', 'reports', 'reports have']
  ])('it confirms %i animals as %j', (animalCount, title, reports, have) => {
    // Arrange
    // Act
    const model = buildViewModel({ request, animalCount })

    // Assert
    expect(model).toEqual({
      pageTitle: title,
      heading: title,
      received: `We have received your death ${reports}. You will also receive a confirmation email.`,
      reviewed: `You will receive an email once your ${have} been reviewed if it is successful or we require further information.`,
      homeHref: '/holdings/10/081/1234/cattle'
    })
  })
})
