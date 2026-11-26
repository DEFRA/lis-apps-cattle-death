import { animalOf, holdingOf, reportOf } from './report-key.js'

const request = {
  params: {
    cph: '10/081/1234',
    submissionId: '7ZK-M3Q-A9D',
    animalId: 'UK123456301550'
  }
}

describe('report-key', () => {
  test('holdingOf() gives the holding in the path', () => {
    // Arrange
    // Act
    const result = holdingOf(request)

    // Assert
    expect(result).toEqual({ cph: '10/081/1234' })
  })

  test('reportOf() gives the holding and the report in the path', () => {
    // Arrange
    // Act
    const result = reportOf(request)

    // Assert
    expect(result).toEqual({
      cph: '10/081/1234',
      submissionId: '7ZK-M3Q-A9D'
    })
  })

  test('animalOf() gives the holding, the report and the animal in the path', () => {
    // Arrange
    // Act
    const result = animalOf(request)

    // Assert
    expect(result).toEqual({
      cph: '10/081/1234',
      submissionId: '7ZK-M3Q-A9D',
      animalId: 'UK123456301550'
    })
  })
})
