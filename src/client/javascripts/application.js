import { createAll, ErrorSummary, Radios } from 'govuk-frontend'
import { errorPageComponents } from '@defra/lis-infra-ui-services/components/error-pages'
import { layoutComponents } from '@defra/lis-infra-ui-services/components/layout'

for (const component of new Set([
  ...layoutComponents,
  ...errorPageComponents,
  ErrorSummary,
  Radios
])) {
  createAll(component)
}
