import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'
import { issueHubJwt } from '@defra/lis-hubs-infra-access/auth'

import { config } from '#config/config.js'
import { createServer } from '#server/server.js'
import { homeController } from './controller.js'

async function createHubJwt(roles = ['lis-role-cattle-death-read']) {
  return issueHubJwt(
    {
      sub: 'test-user',
      email: 'test.user@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles,
      serviceId: 'test-service'
    },
    {
      secret: config.get('auth.hubJwt.secret'),
      issuer: config.get('auth.hubOrigins')[0],
      audience: config.get('auth.hubJwt.audience'),
      ttlSeconds: config.get('auth.hubJwt.ttlSeconds')
    }
  )
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

    const jwt = await createHubJwt()
    request.headers = {
      cookie: `${config.get('auth.hubJwt.cookieName')}=${jwt}`
    }

    const { result, statusCode } = await server.inject(request)

    expect(result).toEqual(expect.stringContaining('Death for Cattle |'))
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should redirect to the hub when the JWT is missing', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(statusCode).toBe(302)
    expect(headers.location).toContain(
      `${config.get('auth.hubOrigins')[0]}/auth/login?returnUrl=`
    )
  })

  test.each([
    [{ firstName: 'Ada', lastName: 'Lovelace' }, 'Ada Lovelace'],
    [{ sub: 'subject-123' }, 'subject-123'],
    [{}, 'Authenticated user']
  ])('uses the available signed-in identity', (hubAuth, signedInAs) => {
    const view = vi.fn()

    homeController.handler({ app: { hubAuth } }, { view })

    expect(view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({ signedInAs })
    )
  })
})
