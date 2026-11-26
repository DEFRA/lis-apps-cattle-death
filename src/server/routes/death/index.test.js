import { death } from './index.js'
import { demandDeathAccess } from './holding-access.js'
import { demandUnsentReport } from './sent-report.js'
import { MAX_ECHO_LENGTH } from './form-limits.js'

vi.mock('#server/services/be4fe/animal.js')
vi.mock('#server/services/be4fe/submission.js')
vi.mock('#server/services/be4fe/data.js')

/** @import { ServerRoute } from '@hapi/hapi' */

/**
 * @returns {ServerRoute[]} the routes the plugin registers
 */
function registeredRoutes() {
  const server = { route: vi.fn(), ext: vi.fn() }
  death.plugin.register(server)

  return server.route.mock.calls.flatMap(([routes]) => routes)
}

/**
 * @param {string} method
 * @param {string} pathEnd - the end of the route's path
 * @returns {ServerRoute} the registered route
 */
function routeAt(method, pathEnd) {
  return registeredRoutes().find(
    (route) => route.method === method && route.path.endsWith(pathEnd)
  )
}

/**
 * @param {Function} failAction
 * @param {string} source - what failed validation: params or payload
 * @returns {Error} what the fail action throws for it
 */
function failureFor(failAction, source) {
  try {
    failAction({}, {}, { output: { payload: { validation: { source } } } })
  } catch (error) {
    return error
  }
}

const validParams = {
  cph: '10/081/1234',
  submissionId: '7ZK-M3Q-A9D',
  animalId: 'UK123456301550'
}

describe('death routes', () => {
  test('every route demands death access, and every page of a report but its confirmation an unsent report', () => {
    // Arrange
    const routes = registeredRoutes()

    // Act
    const pres = routes.map(({ method, path, options }) => [
      `${method} ${path}`,
      options.pre.map(({ method: pre }) => pre)
    ])

    // Assert
    expect(routes.length).toBeGreaterThan(0)
    expect(pres).toEqual(
      routes.map(({ method, path }) => [
        `${method} ${path}`,
        path.includes('{submissionId}') && !path.endsWith('/confirmation')
          ? [demandDeathAccess, demandUnsentReport]
          : [demandDeathAccess]
      ])
    )
  })

  test.each([
    ['params', 404],
    ['payload', 400]
  ])('a request whose %s fail validation is answered %i', (source, code) => {
    // Arrange
    const { failAction } = routeAt('GET', '/death').options.validate

    // Act
    const error = failureFor(failAction, source)

    // Assert
    expect(error.output.statusCode).toBe(code)
  })

  test.each([
    ['GET', '/death', { cph: validParams.cph }],
    ['GET', '/animals/is-registered', validParams],
    ['GET', '/{animalId}/is-registered', validParams]
  ])('%s …%s takes well-formed params', (method, pathEnd, params) => {
    // Arrange
    const schema = routeAt(method, pathEnd).options.validate.params

    // Act
    const { error } = schema.validate(params, { allowUnknown: true })

    // Assert
    expect(error).toBeUndefined()
  })

  test.each([
    ['GET', '/death', 'cph', '10/81/1234'],
    ['GET', '/animals/is-registered', 'cph', '1008112340'],
    ['GET', '/animals/is-registered', 'submissionId', '7ZK-M3Q-A9U'],
    ['GET', '/animals/is-registered', 'submissionId', '7ZKM3QA9D'],
    ['GET', '/{animalId}/is-registered', 'animalId', 'UK 123456301550'],
    ['GET', '/{animalId}/is-registered', 'animalId', 'UK1234563015501234567'],
    ['GET', '/{animalId}/is-registered', 'animalId', '../is-registered']
  ])('%s …%s refuses %s %j', (method, pathEnd, name, value) => {
    // Arrange
    const schema = routeAt(method, pathEnd).options.validate.params
    const params = { ...validParams, [name]: value }

    // Act
    const { error } = schema.validate(params, { allowUnknown: true })

    // Assert
    expect(error).toBeDefined()
  })

  test('every route that takes a form refuses a field that is not one string', () => {
    // Arrange
    const forms = registeredRoutes().filter(
      ({ options }) => options.validate.payload
    )

    // Act
    const accepted = forms.flatMap(({ path, options }) => {
      const schema = options.validate.payload
      const fields = Object.keys(schema.describe().keys)

      return fields
        .filter((field) => !schema.validate({ [field]: ['a', 'b'] }).error)
        .map((field) => `${path} ${field}`)
    })

    // Assert
    expect(forms.length).toBeGreaterThan(0)
    expect(accepted).toEqual([])
  })

  test('every route that takes a form takes an answer too long to show again as not given', () => {
    // Arrange
    const tooLong = 'a'.repeat(MAX_ECHO_LENGTH + 1)
    const forms = registeredRoutes().filter(
      ({ options }) => options.validate.payload
    )

    // Act
    const taken = forms.flatMap(({ options }) => {
      const schema = options.validate.payload

      return Object.keys(schema.describe().keys).map((field) => [
        field,
        schema.validate({ [field]: tooLong }).value[field]
      ])
    })

    // Assert
    expect(taken.length).toBeGreaterThan(0)
    expect(taken).toEqual(taken.map(([field]) => [field, '']))
  })

  test('every route that takes a form gives a missing field as blank, and drops one it does not know', () => {
    // Arrange
    const forms = registeredRoutes().filter(
      ({ options }) => options.validate.payload
    )

    // Act
    const results = forms.map(({ options }) =>
      options.validate.payload.validate({ unknown: 'x' })
    )

    // Assert
    expect(results).toEqual(
      forms.map(({ options }) => ({
        value: Object.fromEntries(
          Object.keys(options.validate.payload.describe().keys).map((field) => [
            field,
            ''
          ])
        )
      }))
    )
  })
})
