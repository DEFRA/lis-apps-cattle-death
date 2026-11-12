/** @import { Server } from '@hapi/hapi' */
import inert from '@hapi/inert'
import { createSpokeAuth } from '@defra/lis-hubs-infra-access/authentication'

import { home } from '../routes/home/index.js'
import { health } from '../routes/health/index.js'

import { serveStaticFiles } from './serve-static-files.js'
import { config } from '#config/config.js'
import { moduleAccess } from '../../../module-access.js'

const spokeAuth = createSpokeAuth({
  spokeId: 'cattle-death',
  hubOrigins: config.get('auth.hubOrigins'),
  port: config.get('port'),
  secret: config.get('auth.hubJwt.secret'),
  audience: config.get('auth.hubJwt.audience'),
  moduleAccess
})

export const router = {
  plugin: {
    name: 'router',
    /**
     * Registers the plugins and routes for this spoke.
     * @param {Server} server - The Hapi server
     */
    async register(server) {
      await server.register([inert, spokeAuth])

      await server.register([health, home])

      await server.register(serveStaticFiles)
    }
  }
}
