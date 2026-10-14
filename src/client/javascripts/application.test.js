import { describe, expect, test, vi } from 'vitest'

const {
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  createAll,
  LayoutOne,
  LayoutTwo
} = vi.hoisted(() => ({
  Button: class {},
  Checkboxes: class {},
  ErrorSummary: class {},
  Radios: class {},
  createAll: vi.fn(),
  LayoutOne: class {},
  LayoutTwo: class {}
}))

vi.mock('govuk-frontend', () => ({
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  createAll
}))
vi.mock('@defra/lis-infra-ui-services/components/layout', () => ({
  layoutComponents: [LayoutOne, LayoutTwo]
}))
vi.mock('@defra/lis-infra-ui-services/components/error-pages', () => ({
  errorPageComponents: [Button, LayoutTwo]
}))

describe('browser application bootstrap', () => {
  test('starts each shared layout component, each error page component, then each page-level GOV.UK component, starting a component listed in both shared lists once', async () => {
    await import('./application.js')

    expect(createAll.mock.calls).toEqual([
      [LayoutOne],
      [LayoutTwo],
      [Button],
      [Checkboxes],
      [ErrorSummary],
      [Radios]
    ])
  })
})
