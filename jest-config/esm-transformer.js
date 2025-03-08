const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: 'commonjs' // Explicitly convert ESM to CommonJS
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Add any additional plugins if needed
  ],
  babelrc: false,
  configFile: false,
});
