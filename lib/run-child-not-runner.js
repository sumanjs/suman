//core
const path = require('path');

//npm
const colors = require('colors/safe');

//project
const constants = require('../config/suman-constants');

process.on('uncaughtException', function (err) {
	console.log(' => Suman => Uncaught exception in your test =>', '\n', err.stack + '\n\n');
	process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

const root = global.projectRoot;
const sumanConfig = global.sumanConfig;
const sumanHelperDirRoot = global.sumanHelperDirRoot;


if(global.sumanOpts.register){

	console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
		'use the -v option for more info.'));

	require('babel-register')({
		// This will override `node_modules` ignoring - you can alternatively pass
		// an array of strings to be explicitly matched or a regex / glob
		// ignore: false
	});
}

require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';


function run(file) {

	if(singleProc){
		require('./handle-single-proc')(file);
	}
	else{
		require(file);
	}

}

module.exports = run;

