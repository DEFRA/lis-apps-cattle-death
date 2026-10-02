import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'

import { spokeAuth } from '#test-helpers/spoke-auth.js'
import { createServer } from '#server/server.js'
import { homeController } from './controller.js'

function createUser(
  statements = [
    {
      role: 'lis-role-cattle-death-read',
      cphs: '*',
      permissions: ['lis-perm-cattle-death-read']
    }
  ]
) {
  return {
    sub: 'test-user',
    email: 'test.user@example.com',
    firstName: 'Test',
    lastName: 'User',
    statements,
    serviceId: 'test-service'
  }
}

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const request = {
      method: 'GET',
      url: '/'
    }

    const user = createUser()
    request.auth = spokeAuth(user)

    const { result, statusCode } = await server.inject(request)

    expect(result).toEqual(expect.stringContaining('Death for Cattle'))
    expect(result).toEqual(expect.stringContaining('Livestock Information'))
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should reject a request without a hub service token', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(statusCode).toBe(statusCodes.unauthorized)
    expect(result).toEqual({ message: 'Service authentication required' })
  })

  test.each([
    [{ firstName: 'Ada', lastName: 'Lovelace' }, 'Ada Lovelace'],
    [{ sub: 'subject-123' }, 'subject-123'],
    [{}, 'Authenticated user']
  ])('uses the available signed-in identity', (user, signedInAs) => {
    const view = vi.fn()

    homeController.handler({ auth: { credentials: { user } } }, { view })

    expect(view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({ signedInAs })
    )
  })
})
