const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

// List of packages that use ES modules and need to be transformed
const esmModules = [
  '@simplewebauthn',
  '@coinbase/wallet-sdk',
  '@dynamic-labs',
  '@safe-global',
  '@abstract-foundation',
  '@privy-io'
];

module.exports = {
  ...nxPreset,
  // Properly handle both ES modules and CommonJS
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm/)?((@simplewebauthn\\/browser|@simplewebauthn|@coinbase\\/wallet-sdk|@dynamic-labs|@safe-global|@abstract-foundation|@privy-io)/)|(.pnpm/@coinbase\\+wallet-sdk@4.3.0)|(.pnpm/@simplewebauthn\\+browser@9.0.1))"
  ],
  transform: {
    '^.+\\.(ts|js|html)$': ['@swc/jest'],
    '^.+\\.m?js$': path.join(__dirname, 'jest-config/esm-transformer.js'),
  },
  moduleNameMapper: {
    // Mock problematic ESM modules
    '^@simplewebauthn/browser$': path.join(__dirname, 'jest-config/mocks/simplewebauthn-browser.js'),
    '^@coinbase/wallet-sdk$': path.join(__dirname, 'jest-config/mocks/coinbase-wallet-sdk.js')
  },
  // Ensure Jest knows to handle ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'node',
};
