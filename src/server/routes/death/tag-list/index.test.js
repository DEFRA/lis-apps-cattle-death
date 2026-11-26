import { readFileSync } from 'node:fs'
import nunjucks from 'nunjucks'
import { createNunjucksConfig } from '@defra/lis-infra-ui-services/nunjucks/plugin'
import { config } from '#config/config.js'

const { environment } = createNunjucksConfig({
  config,
  logger: {},
  moduleId: 'cattle-death'
}).options.compileOptions
const template = nunjucks.compile(
  readFileSync(new URL('./index.njk', import.meta.url), 'utf8'),
  environment
)

/**
 * @param {object} context - the view model
 * @returns {string} the page, rendered
 */
function render(context) {
  return template.render({
    getAssetPath: (asset) => asset,
    errorList: [],
    fieldErrors: {},
    values: {},
    ...context
  })
}

describe('tag list page', () => {
  test('it shows the animals in a pane that scrolls sideways, named as the table is', () => {
    // Act
    const html = render({
      animals: [
        {
          id: 'UK123456301550',
          href: '/check',
          earTagNumber: 'UK123456301550',
          isReady: true
        }
      ]
    })

    // Assert
    expect(html).toMatch(
      /<div class="lis-scrollable-pane" data-module="lis-scrollable-pane" role="region" tabindex="0" aria-label="Cattle deaths to report">\s*<table class="govuk-table" id="animals">\s*<caption class="govuk-table__caption govuk-visually-hidden">Cattle deaths to report<\/caption>/
    )
    expect(html).toContain('>UK123456301550</a>')
  })

  test('it shows no pane when there are no animals', () => {
    // Act
    const html = render({ animals: [] })

    // Assert
    expect(html).not.toContain('lis-scrollable-pane')
    expect(html).toContain('No deaths have been recorded.')
  })
})
