import { homeController } from './controller.js'

export const home = {
  plugin: {
    name: 'home',
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
