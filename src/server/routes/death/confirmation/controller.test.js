import Boom from '@hapi/boom'

import * as submissionClient from '#server/services/be4fe/submission.js'
import { confirmationController } from './controller.js'

vi.mock('#server/services/be4fe/submission.js')

const request = {
  params: { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' },
  auth: { credentials: { user: { sub: 'keeper-1' } } }
}

const mocks = {
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

/**
 * @returns {object} a response toolkit
 */
function toolkit() {
  return {
    view: vi.fn().mockReturnValue('viewed'),
    redirect: vi.fn().mockReturnValue('redirected')
  }
}

describe('confirmationController', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('it confirms how many deaths a sent report reported', async () => {
    // Arrange
    const h = toolkit()
    mocks.getSubmission.mockResolvedValueOnce({
      status: 'SUBMITTED',
      animals: [{ animalId: 'UK123456301550' }, { animalId: 'UK123456401560' }]
    })

    // Act
    const result = await confirmationController.handler(request, h)

    // Assert
    expect(mocks.getSubmission).toHaveBeenCalledWith({
      ...request.params
    })
    expect(h.view).toHaveBeenCalledWith(
      'death/confirmation/index',
      expect.objectContaining({ heading: '2 cattle deaths reported' })
    )
    expect(result).toBe('viewed')
  })

  test.each([
    [
      'a report not sent',
      () =>
        mocks.getSubmission.mockResolvedValueOnce({
          status: 'DRAFT',
          animals: []
        })
    ],
    [
      'a report there is not',
      () => mocks.getSubmission.mockRejectedValueOnce(Boom.notFound())
    ]
  ])('it sends %s on to the holding cattle', async (_description, arrange) => {
    // Arrange
    const h = toolkit()
    arrange()

    // Act
    await confirmationController.handler(request, h)

    // Assert
    expect(h.redirect).toHaveBeenCalledWith(
      '/holdings/10/081/1234/cattle/animals'
    )
    expect(h.view).not.toHaveBeenCalled()
  })

  test('it rethrows any other failure', async () => {
    // Arrange
    const h = toolkit()
    const failure = new Error('503 - Service unavailable')
    mocks.getSubmission.mockRejectedValueOnce(failure)

    // Act
    let error
    try {
      await confirmationController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).toBe(failure)
  })
})
