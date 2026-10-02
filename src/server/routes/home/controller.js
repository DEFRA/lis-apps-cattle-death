import { buildMicrositePath } from '@defra/lis-infra-ui-services'
import { taxonomy } from '@defra/lis-taxonomy-death'
import { species } from '@defra/lis-species-cattle'

export const homeController = {
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
      hubPath: buildMicrositePath(taxonomy.id, species.id),
      apiEndpoint: 'http://localhost:3228/api/species/cattle/taxonomies/death'
    })
  }
}
