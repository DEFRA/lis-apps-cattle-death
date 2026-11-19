import { animalOf, keeperOf, reportOf } from './report-key.js'

const request = {
  params: {
    cph: '10/081/1234',
    submissionId: '7ZK-M3Q-A9D',
    animalId: 'UK123456301550'
  },
  auth: { credentials: { user: { sub: 'keeper-1' } } }
}

describe('report-key', () => {
  test('keeperOf() gives the holding in the path and the signed-in user', () => {
    // Arrange
    // Act
    const result = keeperOf(request)

    // Assert
    expect(result).toEqual({ cph: '10/081/1234', userId: 'keeper-1' })
  })

  test('reportOf() gives the keeper and the report in the path', () => {
    // Arrange
    // Act
    const result = reportOf(request)

    // Assert
    expect(result).toEqual({
      cph: '10/081/1234',
      userId: 'keeper-1',
      submissionId: '7ZK-M3Q-A9D'
    })
  })

  test('animalOf() gives the keeper, the report and the animal in the path', () => {
    // Arrange
    // Act
    const result = animalOf(request)

    // Assert
    expect(result).toEqual({
      cph: '10/081/1234',
      userId: 'keeper-1',
      submissionId: '7ZK-M3Q-A9D',
      animalId: 'UK123456301550'
    })
  })
})
