// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/*.spec.ts'], // Looks for test files with `.spec.ts` extension
    moduleNameMapper: {
      '^assets/(.*)$': '<rootDir>/src/assets/$1', // Adjust based on your project structure
    },
  };
  