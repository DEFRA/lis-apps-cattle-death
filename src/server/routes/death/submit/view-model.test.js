import { buildViewModel } from './view-model.js'

describe('send death report view model', () => {
  test('it asks to send the report, posting to itself and going back to the list of animals', () => {
    // Arrange
    const request = {
      params: { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
    }

    // Act
    const model = buildViewModel({ request })

    // Assert
    expect(model).toEqual({
      pageTitle: 'Now send your cattle death report',
      heading: 'Now send your cattle death report',
      backLinkHref: '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D',
      formAction: '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/submit'
    })
  })
})
