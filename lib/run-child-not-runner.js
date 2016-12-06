'use striiiict';

//core
const path = require('path');
const util = require('util');

//npm
const colors = require('colors/safe');
const sumanUtils = require('suman-utils/utils');

//project
const constants = require('../config/suman-constants');

///////////////////////////////////////////////////////////////////////////////////////////

process.on('uncaughtException', function (err) {

  if (typeof err !== 'object') {
    err = { stack: typeof err === 'string' ? err : util.inspect(err) }
  }


  process.nextTick(function(){
    if (err && !err._alreadyHandledBySuman) {
      console.error('\n', ' => Suman uncaught exception =>', '\n', (err.stack || err),'\n\n');
    }
  });

  // process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);

});

const root = global.projectRoot || sumanUtils.findProjectRoot(process.cwd());
const sumanConfig = global.sumanConfig;


const sumanHelperDirRoot = global.sumanHelperDirRoot;
console.log(colors.red.bold(' => Suman helper root => ', sumanHelperDirRoot));


try {
  require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
}
catch (err) {
  console.error('\n\n', colors.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file =>') +
    '\n' + (global.sumanOpts.verbose ? (err.stack || err) : '') + '\n');
}

function run (files) {


  if (global.sumanOpts.register) {

    console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
      'use the -v option for more info.'));

    require('babel-register')({
      // This will override `node_modules` ignoring - you can alternatively pass
      // an array of strings to be explicitly matched or a regex / glob
      // ignore: false
    });
  }

  if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
    console.log(' => Suman debug message => we are in SUMAN_SINGLE_PROCESS mode.');
    require('./helpers/log-stdio-of-child')('suman-single-process');
    require('./handle-single-proc-new2')(files);
  }
  else {
    require('./helpers/log-stdio-of-child')(files[0]);
    require(files[ 0 ]);
  }

}

module.exports = run;

