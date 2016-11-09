'use striiict';

//npm
const util = require('util');
const assert = require('assert');

//npm
const pragmatik = require('pragmatik');

//project

//////////////////////////////////////////////////////////////

module.exports = Object.freeze({

  blockSignature: pragmatik.signature({

    mode: 'strict', // does not allow two adjacent non-required types to be the same
    allowExtraneousTrailingVars: false,
    args: [
      {
        type: 'string',
        required: true,
        errorMessage: 'First argument to describe/suite blocks must be a string description/title with a length greater than zero.\n' +
        'The signature is (String s, [Object opts,] Function f)',
        checks: [
          function (val, rule) {
            assert(val.length > 0, rule.errorMessage);
          }
        ]
      },
      {
        type: 'object',
        required: false,
        errorMessage: 'Options object should be an object and not an array.' +
        'The signature is (String s, [Object opts,] Function f)',
        default: function(){
          return {};
        },
        checks: [
          function (val, rule) {
            assert(typeof val === 'object' && !Array.isArray(val), rule.errorMessage +
              ', instead we got => ' + util.inspect(val));
          }
        ]
      },
      {
        type: 'function',
        required: true,
        errorMessage: 'Callback function is required for describe/suite blocks.' +
        'The signature is (String s, [Object opts,] Function f)'
      }
    ]
  }),

  hookSignature: pragmatik.signature({

    mode: 'strict', // does not allow two adjacent non-required types to be the same
    allowExtraneousTrailingVars: false,
    args: [
      {
        type: 'string',
        required: false,
        errorMessage: 'First argument must be a string description/title for the hook with a length greater than zero.\n' +
        'Signature is => (String s, [Object opts,] Function f)',
        checks: [
          function (val, rule) {
            assert(val.length > 0, rule.errorMessage);
          }
        ]
      },
      {
        type: 'object',
        required: false,
        errorMessage: 'Options object should be an object and not an array ' +
        '=> Signature is => ( String s, [Object opts, Function f]).',
        default: function(){
          return {};
        },
        checks: [
          function (val) {
            assert(typeof val === 'object' && !Array.isArray(val), 'Options object should be a plain {} object,' +
              'instead we got => ' + util.inspect(val));
          }
        ]
      },
      {
        type: 'function',
        required: false,
        errorMessage: 'Callback function must be a function. ' +
        'Signature for all hooks is => (String s, [Object opts, Function f])',
        checks: [
          function (val, rules, retArgs) {
            if (typeof val !== 'function') {
              assert(typeof retArgs[ 0 ] === 'string', 'For Suman hooks (before/after/beforeEach/afterEach), if you do not\n' +
                'provide a callback (hook is stubbed) then you must provide a string description as the first argument.');
            }

          }
        ]
      }
    ]
  }),

  testCaseSignature: pragmatik.signature({

    mode: 'strict', // does not allow two adjacent non-required types to be the same
    allowExtraneousTrailingVars: false,
    args: [
      {
        type: 'string',
        required: true,
        errorMessage: 'First argument to top-level describe must be a string description/title for the test suite, ' +
        'with a length greater than zero.\n' +
        'Signature for test cases is => (String s, [Object opts, Function f])',
        checks: [
          function (val, rule) {
            assert(val.length > 0, rule.errorMessage);
          }
        ]
      },
      {
        type: 'object',
        required: false,
        errorMessage: 'Options object should be an object and not an array. ' +
        'Signature for test cases is => (String s, [Object opts, Function f])',
        default: function(){
          return {};
        },
        checks: [
          function (val) {
            assert(typeof val === 'object' && !Array.isArray(val), 'Options object should be a plain {} object,' +
              'instead we got => ' + util.inspect(val));
          }
        ]
      },
      {
        type: 'function',
        required: false,
        errorMessage: 'Callback function must be a function. ' +
        'Signature for test cases is => (String s, [Object opts, Function f])',
        checks: []
      }
    ]
  }),

});