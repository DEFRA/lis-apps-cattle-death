import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import { startReportController } from './controller.js'

vi.mock('#server/services/temporary-be4fe/submission.js')

const mocks = {
  startReport: vi.mocked(submissionClient.startReport)
}

const KEEPER = { cph: '10/081/1234', userId: 'keeper-1' }
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'

/**
 * @returns {object} a request to start a death report on the holding
 */
function startRequest() {
  return {
    params: { cph: KEEPER.cph },
    auth: { credentials: { user: { sub: KEEPER.userId } } }
  }
}

describe('startReportController', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test("it continues the keeper's report at whether its first animal is registered", async () => {
    // Arrange
    const h = { redirect: vi.fn().mockReturnValue('redirected') }
    mocks.startReport.mockResolvedValueOnce({
      submissionId: '7ZK-M3Q-A9D',
      animalId: 'UK123456301550'
    })

    // Act
    const result = await startReportController.handler(startRequest(), h)

    // Assert
    expect(mocks.startReport).toHaveBeenCalledWith(KEEPER)
    expect(h.redirect).toHaveBeenCalledWith(
      `${REPORT_PATH}/animals/UK123456301550/is-registered`
    )
    expect(result).toBe('redirected')
  })

  test('it starts a report with no animal at whether a new one is registered', async () => {
    // Arrange
    const h = { redirect: vi.fn().mockReturnValue('redirected') }
    mocks.startReport.mockResolvedValueOnce({ submissionId: '7ZK-M3Q-A9D' })

    // Act
    await startReportController.handler(startRequest(), h)

    // Assert
    expect(h.redirect).toHaveBeenCalledWith(
      `${REPORT_PATH}/animals/is-registered`
    )
  })

  test('it rethrows a failure to start', async () => {
    // Arrange
    const h = { redirect: vi.fn() }
    const failure = new Error('503 - Service unavailable')
    mocks.startReport.mockRejectedValueOnce(failure)

    // Act
    let error
    try {
      await startReportController.handler(startRequest(), h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).toBe(failure)
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
