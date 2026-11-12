/** @import { Server } from '@hapi/hapi' */
import { homeController } from './controller.js'

export const home = {
  plugin: {
    name: 'home',
    /**
     * Registers the home route.
     * @param {Server} server - The Hapi server
     */
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/holdings/{cph*3}/cattle/death',
          ...homeController
        }
      ])
    }
  }
}
