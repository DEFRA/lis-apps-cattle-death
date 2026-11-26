import Boom from '@hapi/boom'

import * as submissionClient from '#server/services/be4fe/submission.js'
import { demandUnsentReport } from './sent-report.js'

vi.mock('#server/services/be4fe/submission.js')

const PARAMS = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const request = {
  params: PARAMS,
  auth: { credentials: { user: { sub: 'keeper-1' } } }
}

const mocks = {
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

/**
 * @returns {{ h: object, redirected: object }} a response toolkit whose
 *   redirect records being taken over
 */
function toolkit() {
  const redirected = { takeover: vi.fn().mockReturnValue('taken over') }
  const h = {
    continue: Symbol('continue'),
    redirect: vi.fn().mockReturnValue(redirected)
  }
  return { h, redirected }
}

describe('demandUnsentReport()', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('it lets a report not yet sent continue', async () => {
    // Arrange
    const { h } = toolkit()
    mocks.getSubmission.mockResolvedValueOnce({ status: 'DRAFT' })

    // Act
    const result = await demandUnsentReport(request, h)

    // Assert
    expect(mocks.getSubmission).toHaveBeenCalledWith({
      ...PARAMS
    })
    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })

  test('it takes a sent report to its confirmation', async () => {
    // Arrange
    const { h, redirected } = toolkit()
    mocks.getSubmission.mockResolvedValueOnce({ status: 'SUBMITTED' })

    // Act
    const result = await demandUnsentReport(request, h)

    // Assert
    expect(h.redirect).toHaveBeenCalledWith(
      '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/confirmation'
    )
    expect(redirected.takeover).toHaveBeenCalled()
    expect(result).toBe('taken over')
  })

  test('it propagates not found for a report the keeper does not have', async () => {
    // Arrange
    const { h } = toolkit()
    mocks.getSubmission.mockRejectedValueOnce(Boom.notFound())

    // Act
    let error
    try {
      await demandUnsentReport(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error.output.statusCode).toBe(404)
  })
})
