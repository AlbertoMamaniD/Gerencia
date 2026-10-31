// Jest necesita React en modo desarrollo; algunas máquinas tienen NODE_ENV=production global.
process.env.NODE_ENV = 'test';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.tsx'],
  setupFilesAfterEnv: ['./jest.setup-after-env.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-gifted-charts|gifted-charts-core|zustand)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/app/_layout.tsx',
    '!src/services/ocr/prepareImage.ts',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
    './src/domain/': { statements: 90, branches: 80, functions: 90, lines: 90 },
    './src/utils/': { statements: 90, branches: 80, functions: 90, lines: 90 },
  },
};
