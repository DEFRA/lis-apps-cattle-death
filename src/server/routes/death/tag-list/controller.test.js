import * as animalClient from '#server/services/temporary-be4fe/animal.js'
import * as dataClient from '#server/services/temporary-be4fe/data.js'
import * as submissionClient from '#server/services/temporary-be4fe/submission.js'
import {
  listAnimals,
  tagListController,
  tagListSubmitController
} from './controller.js'

vi.mock('#server/services/temporary-be4fe/animal.js')
vi.mock('#server/services/temporary-be4fe/data.js')
vi.mock('#server/services/temporary-be4fe/submission.js')

const TEMPLATE = 'death/tag-list/index'
const PARAMS = { cph: '10/081/1234', submissionId: '7ZK-M3Q-A9D' }
const REPORT = { ...PARAMS, userId: 'keeper-1' }
const REPORT_PATH = '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
const auth = { credentials: { user: { sub: 'keeper-1' } } }
const registered = {
  isRegistered: 'yes',
  earTagNumber: 'UK123456301550',
  dateOfDeath: '1/11/2026'
}
const unfinished = { isRegistered: 'no', earTagNumber: 'UK123456401560' }

const mocks = {
  getAnimal: vi.mocked(animalClient.getAnimal),
  getHoldingCattle: vi.mocked(dataClient.getHoldingCattle),
  getUnusedEarTags: vi.mocked(dataClient.getUnusedEarTags),
  getSubmission: vi.mocked(submissionClient.getSubmission)
}

/**
 * @param {object[]} deaths - the report's animals, in order
 * @returns {void}
 */
function reportHolds(deaths) {
  mocks.getSubmission.mockResolvedValueOnce({
    animals: deaths.map(({ earTagNumber }) => ({ animalId: earTagNumber }))
  })
  for (const death of deaths) {
    mocks.getAnimal.mockResolvedValueOnce(death)
  }
}

/**
 * @param {object} [payload]
 * @returns {object} a request for the list of animals
 */
function requestFor(payload) {
  return { params: PARAMS, auth, payload }
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

describe('tag list', () => {
  beforeAll(() => {
    mocks.getHoldingCattle.mockResolvedValue([
      { earTagNumber: 'UK123456301550', status: 'alive' }
    ])
    mocks.getUnusedEarTags.mockResolvedValue(['UK123456401561'])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('listAnimals()', () => {
    test('it judges each animal whole: ready ones link to check animal details, others to the page to finish', async () => {
      // Arrange
      reportHolds([registered, unfinished])

      // Act
      const animals = await listAnimals(REPORT)

      // Assert
      expect(mocks.getSubmission).toHaveBeenCalledWith(REPORT)
      expect(mocks.getUnusedEarTags).toHaveBeenCalledWith(REPORT)
      expect(mocks.getAnimal).toHaveBeenCalledWith({
        ...REPORT,
        animalId: 'UK123456301550'
      })
      expect(animals).toEqual([
        {
          animalId: 'UK123456301550',
          earTagNumber: 'UK123456301550',
          page: 'check-animal-details',
          isReady: true
        },
        {
          animalId: 'UK123456401560',
          earTagNumber: 'UK123456401560',
          page: 'unregistered-animal-details',
          isReady: false
        }
      ])
    })
  })

  describe('GET', () => {
    test('it shows the empty list', async () => {
      // Arrange
      const { h } = toolkit()
      reportHolds([])

      // Act
      await tagListController.handler(requestFor(), h)

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({ animals: [], errorList: [] })
      )
    })
  })

  describe('POST', () => {
    test('Yes adds a new animal, at whether it is registered', async () => {
      // Arrange
      const { h } = toolkit()
      reportHolds([registered])

      // Act
      const result = await tagListSubmitController.handler(
        requestFor({ addAnother: 'yes' }),
        h
      )

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(
        `${REPORT_PATH}/animals/is-registered`
      )
      expect(result).toBe('redirected')
    })

    test('No continues to send the report when every animal is ready', async () => {
      // Arrange
      const { h } = toolkit()
      reportHolds([registered])

      // Act
      await tagListSubmitController.handler(requestFor({ addAnother: 'no' }), h)

      // Assert
      expect(h.redirect).toHaveBeenCalledWith(`${REPORT_PATH}/submit`)
    })

    test.each([
      [
        'nothing is selected',
        '',
        [registered],
        'Select yes to add more animals or no to continue.',
        '#addAnother'
      ],
      [
        'No is selected with no animals',
        'no',
        [],
        'Add at least one animal report before continuing',
        '#addAnother'
      ],
      [
        'No is selected while an animal is unfinished',
        'no',
        [registered, unfinished],
        'Complete all required animal details before continuing',
        '#animal-UK123456401560'
      ]
    ])(
      'it shows the list again, as a bad request, when %s',
      async (_description, addAnother, deaths, text, href) => {
        // Arrange
        const { h, response } = toolkit()
        reportHolds(deaths)

        // Act
        await tagListSubmitController.handler(requestFor({ addAnother }), h)

        // Assert
        expect(h.view).toHaveBeenCalledWith(
          TEMPLATE,
          expect.objectContaining({ errorList: [{ text, href }] })
        )
        expect(response.code).toHaveBeenCalledWith(400)
        expect(h.redirect).not.toHaveBeenCalled()
      }
    )

    test('Yes adds no animal once the report has 50', async () => {
      // Arrange
      const { h } = toolkit()
      reportHolds(
        Array.from({ length: 50 }, (_, index) => ({
          ...registered,
          earTagNumber: `UK1234563${String(index).padStart(5, '0')}`
        }))
      )

      // Act
      await tagListSubmitController.handler(
        requestFor({ addAnother: 'yes' }),
        h
      )

      // Assert
      expect(h.view).toHaveBeenCalledWith(
        TEMPLATE,
        expect.objectContaining({
          errorList: [
            {
              text: 'You can add up to 50 animals to one report. Select no to continue',
              href: '#addAnother'
            }
          ]
        })
      )
    })
  })
})
