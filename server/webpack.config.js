'use strict';

const withDefaults = require(`../shared.webpack.config`);
const path = require(`path`);
const webpack = require(`webpack`);

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    extension: `./src/server.ts`,
  },
  output: {
    filename: `server.js`,
    path: path.join(__dirname, `..`, `out`)
  },
  resolve: {
      mainFields: [`module`, `main`],
      extensions: [`.ts`, `.js`], // support ts-files and js-files
			conditionNames: ['import', 'require'],
  },
  plugins: [],
});