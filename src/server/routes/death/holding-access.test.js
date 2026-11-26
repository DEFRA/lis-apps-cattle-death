import {
  PERMISSIONS,
  hasPermission
} from '@defra/lis-hubs-infra-access/authorization'

import { demandDeathAccess } from './holding-access.js'

vi.mock(
  '@defra/lis-hubs-infra-access/authorization',
  async (importOriginal) => ({
    ...(await importOriginal()),
    hasPermission: vi.fn()
  })
)

const NOT_FOUND = 404

const mocks = {
  hasPermission: vi.mocked(hasPermission)
}

const user = { sub: 'keeper' }
const h = { continue: Symbol('continue') }

/**
 * @param {{ cph: string }} params
 * @returns {{ params: { cph: string }, auth: { credentials: { user: { sub: string } } } }}
 *   a request for a death page of the holding
 */
function requestFor(params) {
  return { params, auth: { credentials: { user } } }
}

describe('holding access', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test.each([
    // Write is asked about first, admin only once write is refused
    ['death write', PERMISSIONS.cattleDeathWrite, [true]],
    ['death admin', PERMISSIONS.cattleDeathAdmin, [false, true]]
  ])(
    'demandDeathAccess lets a user with %s on the CPH continue',
    (_, granted, answers) => {
      // Arrange
      for (const answer of answers) {
        mocks.hasPermission.mockReturnValueOnce(answer)
      }

      // Act
      const result = demandDeathAccess(requestFor({ cph: '10/081/1234' }), h)

      // Assert
      expect(result).toBe(h.continue)
      expect(mocks.hasPermission).toHaveBeenCalledWith(user, {
        permission: granted,
        cph: '10/081/1234'
      })
    }
  )

  test('demandDeathAccess answers not found to a user without death access to the CPH', () => {
    // Arrange
    mocks.hasPermission.mockReturnValueOnce(false)
    mocks.hasPermission.mockReturnValueOnce(false)

    // Act
    const result = demandDeathAccess(requestFor({ cph: '10/081/1234' }), h)

    // Assert
    expect(result.output.statusCode).toBe(NOT_FOUND)
    expect(mocks.hasPermission).toHaveBeenCalledWith(user, {
      permission: PERMISSIONS.cattleDeathWrite,
      cph: '10/081/1234'
    })
    expect(mocks.hasPermission).toHaveBeenCalledWith(user, {
      permission: PERMISSIONS.cattleDeathAdmin,
      cph: '10/081/1234'
    })
  })
})
