/** @type {import('jest').Config} */
export default {
  testMatch: ['**/tests/backend/**/*.test.js'],
  transform: {},
  testEnvironment: 'node',
  // Resolve imports relative to the backend's node_modules
  roots: ['<rootDir>/tests/backend'],
  modulePaths: ['<rootDir>/backend/node_modules'],
};
