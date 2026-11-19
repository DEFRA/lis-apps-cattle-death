import { buildViewModel } from './view-model.js'

const request = { params: { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' } }

describe('death report sent view model', () => {
  test.each([
    [1, '1 cattle death reported'],
    [2, '2 cattle deaths reported']
  ])('it confirms %i animals as %j', (animalCount, title) => {
    // Arrange
    // Act
    const model = buildViewModel({ request, animalCount })

    // Assert
    expect(model).toEqual({
      pageTitle: title,
      heading: title,
      homeHref: '/holdings/10/081/1234/cattle'
    })
  })
})
