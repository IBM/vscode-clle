'use strict';

const webpack = require(`webpack`);
const withDefaults = require(`../shared.webpack.config`);
const path = require(`path`);

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    extension: `./src/extension.ts`,
  },
  output: {
    filename: `extension.js`,
    path: path.join(__dirname, `..`, `out`)
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /(canvas|bufferutil|utf-8-validate)/u })
  ]
});