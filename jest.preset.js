const nxPreset = require('@nx/jest/preset').default;

const esmModules = ['@simplewebauthn', "@wagmi", "wagmi"];

module.exports = {
  ...nxPreset,
  // jest needs a commonjs module for any imported packages, so esm modules need to be transformed
  // by default, we don't transform node_modules, but we need to transform imported packages that are esm only.
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`,
  ],
};
