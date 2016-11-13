/**
 * Created by Olegzandr on 11/11/16.
 */


module.exports = Object.freeze({

  localOrGlobalChoices_old: {
    'Locally installed ($ suman foo bar baz)': './node_modules/.bin/suman',
    'Globally installed ($ ./node_modules/.bin/suman foo bar baz)': 'suman'
  },

  nodeDebug: [
    'node debug x.js',
    'node --inspect x.js'
  ],

  sumanDebug: [
    'suman-debug x.js (equivalent to "node debug x.js")',
    'suman-inspect x.js (equivalent to node --inspect x.js)'
  ],

  localOrGlobalChoices: [
    {
      value: './node_modules/.bin/suman',
      name: 'Locally installed ($ ./node_modules/.bin/suman foo bar baz)',
    },
    {
      value: 'suman',
      name: 'Globally installed ($ suman foo bar baz)',
    }
  ],

  // nodeOrSuman: {
  //   '$ node your-test.js': 'node',
  //   '$ suman your-test.js': 'suman'
  // },

  nodeOrSuman: [
    {
      value: 'node',
      name: '$ node your-test.js',
    },
    {
      value: 'suman',
      name: '$ suman your-test.js',
    }
  ],

  topLevelOpts: {
    'GenerateCommand': ' (1) Generate a valid Suman terminal command',
    'Troubleshoot': ' (2) Troubleshoot/debug test(s)',
    'Learn': ' (3) Learn the Suman API'
  }

});