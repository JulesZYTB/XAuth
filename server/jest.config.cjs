/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['ts', 'js'],
  transform: { '^.+\.ts$': 'ts-jest' },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1', // strips .js → resolves .ts
  },
};