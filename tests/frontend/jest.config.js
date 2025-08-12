// tests/frontend/jest.config.js - FINAL WORKING VERSION
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // CORRECT: Use moduleNameMapping with proper absolute paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../Customized-Language-Lesson-Generator-front/src/$1',
  },

  // Additional path resolution
  modulePaths: [
    '<rootDir>',
    '<rootDir>/../../Customized-Language-Lesson-Generator-front/src'
  ],

  // Set the root directory properly
  rootDir: '.',

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ]
    }]
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  collectCoverageFrom: [
    '../../Customized-Language-Lesson-Generator-front/src/**/*.{ts,tsx}',
    '!../../Customized-Language-Lesson-Generator-front/src/**/*.d.ts',
    '!../../Customized-Language-Lesson-Generator-front/src/types/**/*',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testMatch: [
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/**/*.(test|spec).(ts|tsx|js)'
  ],

  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Resolve modules
  resolver: undefined,

  // Clear cache on changes
  clearMocks: true,
  restoreMocks: true
};