//core
const path = require('path');

//project
const constants = require('../config/suman-constants');

process.on('uncaughtException', function (err) {
	console.log(' => Suman => Uncaught exception in your test =>', '\n', err.stack + '\n\n');
	process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

const root = global.projectRoot;
const sumanConfig = global.sumanConfig;

const sumanHelperDirRoot = global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

function run(file) {

	require('./patch-process.stdio');
	require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
	require(file);

}

module.exports = run;

