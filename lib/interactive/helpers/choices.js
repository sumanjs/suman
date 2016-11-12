/**
 * Created by Olegzandr on 11/11/16.
 */


module.exports = Object.freeze({

  localOrGlobalChoices: {
    'Locally installed ($ suman foo bar baz)': './node_modules/.bin/suman',
    'Globally installed ($ ./node_modules/.bin/suman foo bar baz)': 'suman'
  },

  nodeOrSuman: {
    node: '$ node your-test.js',
    suman: '$ suman your-test.js'
  }

});