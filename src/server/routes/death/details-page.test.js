import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import { saveDetails, showDetails } from './details-page.js'

vi.mock('#server/services/temporary-be4fe/animal.js')

const NEW_ANIMAL = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const auth = { credentials: { user: { sub: 'keeper-1' } } }
const today = new Date()
const TODAY = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
const context = {
  holdingCattle: [{ earTagNumber: 'UK123456301551', status: 'alive' }],
  reportedEarTags: []
}

const mocks = {
  saveAnimal: vi.mocked(animalClient.saveAnimal)
}

/**
 * @returns {object} the registered animal details page, with its own
 *   functions stubbed
 */
function registeredDetails() {
  return {
    page: 'registered-animal-details',
    template: 'death/registered-animal-details/index',
    isRegistered: 'yes',
    formValuesFrom: ({ earTagNumber = '', dateOfDeath = '' }) => ({
      earTagNumber,
      dateOfDeath
    }),
    rulesContext: vi.fn().mockResolvedValueOnce(context),
    earTagItemsFrom: vi.fn().mockReturnValueOnce(['UK123456301551']),
    buildViewModel: vi.fn().mockReturnValueOnce('the view model')
  }
}

/**
 * @param {object} [payload]
 * @returns {object} a request for a new animal's page
 */
function requestFor(payload) {
  return { params: NEW_ANIMAL, query: {}, auth, payload }
}

/**
 * @returns {{ h: object, response: object }} a response toolkit whose view
 *   responses record the status code set on them
 */
function toolkit() {
  const response = { code: vi.fn() }
  response.code.mockReturnValue(response)
  const h = {
    view: vi.fn().mockReturnValue(response),
    redirect: vi.fn().mockReturnValue('redirected')
  }
  return { h, response }
}

describe('animal details page', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('showDetails()', () => {
    test("it shows the animal on the page's branch, with the ear tags to suggest", async () => {
      // Arrange
      const { h } = toolkit()
      const details = registeredDetails()
      const request = requestFor()

      // Act
      await showDetails(details, request, h)

      // Assert
      expect(details.rulesContext).toHaveBeenCalledWith(request)
      expect(details.earTagItemsFrom).toHaveBeenCalledWith(context, {
        isRegistered: 'yes'
      })
      expect(details.buildViewModel).toHaveBeenCalledWith({
        request,
        values: { earTagNumber: '', dateOfDeath: '' },
        earTagItems: ['UK123456301551']
      })
      expect(h.view).toHaveBeenCalledWith(
        'death/registered-animal-details/index',
        'the view model'
      )
    })
  })

  describe('saveDetails()', () => {
    test('it saves the trimmed answers on the branch and follows the saved id', async () => {
      // Arrange
      const { h } = toolkit()
      mocks.saveAnimal.mockResolvedValueOnce({ animalId: 'UK123456301551' })
      const request = requestFor({
        earTagNumber: ' UK123456301551 ',
        dateOfDeath: TODAY
      })

      // Act
      const result = await saveDetails(registeredDetails(), request, h)

      // Assert
      expect(mocks.saveAnimal).toHaveBeenCalledWith({
        ...NEW_ANIMAL,
        userId: 'keeper-1',
        animalId: undefined,
        values: {
          isRegistered: 'yes',
          earTagNumber: 'UK123456301551',
          dateOfDeath: TODAY
        }
      })
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/UK123456301551/check-animal-details`
      )
      expect(result).toBe('redirected')
    })

    test('it shows the page again, as a bad request, with what is wrong', async () => {
      // Arrange
      const { h, response } = toolkit()
      const details = registeredDetails()
      const request = requestFor({ earTagNumber: '', dateOfDeath: '' })

      // Act
      await saveDetails(details, request, h)

      // Assert
      expect(details.buildViewModel).toHaveBeenCalledWith({
        request,
        values: { earTagNumber: '', dateOfDeath: '' },
        earTagItems: ['UK123456301551'],
        errors: [
          { field: 'earTagNumber', code: 'required' },
          { field: 'dateOfDeath', code: 'required' }
        ]
      })
      expect(response.code).toHaveBeenCalledWith(400)
      expect(mocks.saveAnimal).not.toHaveBeenCalled()
    })
  })
})
