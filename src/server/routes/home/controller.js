/** @import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi' */
import { getMountPath } from '@defra/lis-hubs-infra-registry'
import { taxonomy } from '@defra/lis-taxonomy-death'
import { species } from '@defra/lis-species-cattle'

export const homeController = {
  /**
   * Renders the home page.
   * @param {Request} request - The Hapi request
   * @param {ResponseToolkit} h - The Hapi response toolkit
   * @returns {ResponseObject} The rendered home view
   */
  handler(request, h) {
    const { user } = request.auth.credentials
    const displayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null
    const signedInAs =
      user?.email ?? displayName ?? user?.sub ?? 'Authenticated user'

    return h.view('home/index', {
      pageTitle: 'Death for Cattle',
      heading: 'Death for Cattle',
      caption: 'Spoke microsite',
      taxonomy,
      species,
      signedInAs,
      directPort: 3203,
      hubPath: getMountPath('cattle-death', 'holding', {
        cph: request.params.cph
      }),
      apiEndpoint: 'http://localhost:3228/api/species/cattle/taxonomies/death'
    })
  }
}
