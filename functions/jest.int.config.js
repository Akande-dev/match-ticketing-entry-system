module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.integration.test.js'],
  testTimeout: 30000, // concurrency tests are slow on first connection to the emulator
};
