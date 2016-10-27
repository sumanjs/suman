//core
const path = require('path');

//npm
const colors = require('colors/safe');

//project
const constants = require('../config/suman-constants');

process.on('uncaughtException', function (err) {
    if(process.listenerCount('uncaughtException') < 2){  // if so, this is likely the only uncaughtException handler...
        console.log(' => Suman => uncaught exception =>', '\n', err.stack + '\n\n');
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    }
});

const root = global.projectRoot;
const sumanConfig = global.sumanConfig;
const sumanHelperDirRoot = global.sumanHelperDirRoot;


if (global.sumanOpts.register) {

    console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
        'use the -v option for more info.'));

    require('babel-register')({
        // This will override `node_modules` ignoring - you can alternatively pass
        // an array of strings to be explicitly matched or a regex / glob
        // ignore: false
    });
}

require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals


function run(files) {

    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
        console.log(' => Suman debug message => we are in SUMAN_SINGLE_PROCESS mode.');
        require('./handle-single-proc')(files);
    }
    else {
        require(files[0]);
    }

}

module.exports = run;

