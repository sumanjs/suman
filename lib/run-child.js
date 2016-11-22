debugger;

if (process.env.NPM_COLORS === 'no') {
  //note that we set this here in case NPM "colors" package needs to this set before hand...
  process.argv.push('--no-color');
  console.error(' => Suman child process setting itself to be color-free (--no-colors)');
}

//core
const path = require('path');
const util = require('util');
const assert = require('assert');

//npm
const colors = require('colors/safe');

//project
const constants = require('../config/suman-constants');
const sumanUtils = require('suman-utils/utils');

//////////////////////////////////////////////////////////////////////////////


const usingRunner = global.usingRunner = true;
const projectRoot = global.projectRoot = sumanUtils.findProjectRoot(process.cwd());

if (process.env.SUMAN_DEBUG === 'yes') {
  console.error(' => child args => ', util.inspect(process.argv));
  console.error(' => child env => ', util.inspect(process.env));
}

process.send = process.send || function (data) {
    console.error(' => Runner cannot receive data, so logging it here => \n' + util.inspect(data));
  };

process.on('uncaughtException', function (err) {

  if (typeof process.send === 'function') {
    process.send({
      type: constants.runner_message_type.FATAL,
      data: {
        msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
        '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
        error: err.stack || err
      }
    });
  }
  else {
    console.error(new Error(' => Suman implementation warning => process.send is ' +
      'not a function even though we are using runner. Perhaps we are using Istanbul?').stack);
  }

  console.error(' => Suman => Uncaught exception in your test =>', '\n', (err.stack || err) + '\n\n');

  if (String(err.stack || err).match(/Cannot find module/i) && global.sumanOpts && global.sumanOpts.transpile) {
    console.log(' => If transpiling, you may need to transpile your entire test directory to the target directory using the ' +
      '--transpile options together.')
  }

  // process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);

});

///////////////////////////////////////
debugger;
///////////////////////////////////////

const babelarg = process.argv.indexOf('--register') > -1;
const filePath = process.env.SUMAN_CHILD_TEST_PATH;

var sumanConfig;
if (true) {
  assert(typeof process.env.SUMAN_CONFIG === 'string', 'process.env.SUMAN_CONFIG is not a string.');
  sumanConfig = global.sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
}
else {
  sumanConfig = global.sumanConfig = require(path.resolve(projectRoot + '/suman.conf.js'));
}

const sumanHelperDirRoot = global.sumanHelperDirRoot =
  global.sumanHelperDirRoot || path.resolve(projectRoot + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

//////////////////////////////////////////////////////////

const register = global.useBabelRegister = (process.argv.indexOf('--use-babel-register') > -1);

if (register) {

  console.log(colors.bgRed.white(' => We are using babel-register.'));

  require('babel-register')({
    // This will override `node_modules` ignoring - you can alternatively pass
    // an array of strings to be explicitly matched or a regex / glob
    // ignore: false
  });
}

if (babelarg) {
  require('babel-core/register')({
    ignore: /node_modules/
  });
}

////////////////////////////////////////////////////////

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';

////////////////////////////////////////////////////////

const domain = require('domain');
const d = domain.create();

d.once('error', function (err) {

  process.send({
    type: constants.runner_message_type.FATAL,
    data: {
      msg: ' => Suman => fatal error in suite with path="' + filePath + '"',
      error: err.stack
    }
  });

  console.error(err.stack);
  process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR_DOMAIN_CAUGHT);
});

//load globals
try {
  require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
}
catch (err) {
  console.error(colors.red(' => Suman usage warning => Could not load your suman.globals.js file =>')
    + '\n' + err.stack);
}

if (singleProc) {
  d.run(function () {
    require('./handle-single-proc')(JSON.parse(process.env.SUMAN_SINGLE_PROCESS_FILES));
  });
}
else {
  console.log('About to run domain...');

  d.run(function () {
    process.nextTick(function () {
      console.log('Requring filepath => ' + filePath);
      require(filePath);
    });
  });
}

