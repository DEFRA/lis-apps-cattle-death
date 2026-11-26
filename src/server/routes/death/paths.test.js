import {
  animalPagePath,
  deathPath,
  holdingHomePath,
  newAnimalPath,
  submissionPagePath,
  submissionPath
} from './paths.js'

describe('paths', () => {
  test.each([
    [
      'deathPath()',
      () => deathPath('10/081/1234'),
      '/holdings/10/081/1234/cattle/death'
    ],
    [
      'submissionPath()',
      () => submissionPath('10/081/1234', '7ZK-M3Q-A9D'),
      '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D'
    ],
    [
      'submissionPagePath()',
      () => submissionPagePath('10/081/1234', '7ZK-M3Q-A9D', 'submit'),
      '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/submit'
    ],
    [
      'animalPagePath()',
      () =>
        animalPagePath(
          '10/081/1234',
          '7ZK-M3Q-A9D',
          'UK123456301550',
          'is-registered'
        ),
      '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/animals/UK123456301550/is-registered'
    ],
    [
      'newAnimalPath()',
      () => newAnimalPath('10/081/1234', '7ZK-M3Q-A9D', 'is-registered'),
      '/holdings/10/081/1234/cattle/death/7ZK-M3Q-A9D/animals/is-registered'
    ],
    [
      'holdingHomePath()',
      () => holdingHomePath('10/081/1234'),
      '/holdings/10/081/1234/cattle'
    ]
  ])('%s gives the path', (_description, path, expected) => {
    // Arrange
    // Act
    const result = path()

    // Assert
    expect(result).toBe(expected)
  })
})
