const path = require('path');
const glob = require('glob');
const _ = require('lodash');
process.env.IS_SUMAN_BROWSER_TEST = 'yes';
const tests = path.resolve(__dirname + '/src/dev/browser/js/**/*.js');

const all = su.flattenDeep([process.env.SUMAN_BROWSER_TEST_PATHS || glob.sync(tests)]);
const entries = all.filter(f => f);

if (!entries.length) {
  throw new Error('no test files could be found given your webpack configuration.');
}

module.exports = {

  entry: entries,

  output: {
    path: path.resolve(__dirname + '/.suman/browser/builds'),
    filename: 'browser-tests.js'
  },

  externals: ['suman'],

  module: {

    rules: [
      {
        test: /babel-polyfill/,
        loader: 'ignore-loader'
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        // ignore .d.ts files
        test: /\.d\.ts$/,
        loader: 'ignore-loader'
      }
    ]
  }

};
