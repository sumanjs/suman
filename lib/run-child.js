
//core
const path = require('path');

//project
const constants = require('../config/suman-constants');
const sumanUtils = require('./utils');

const root = global.projectRoot = sumanUtils.findProjectRoot(process.cwd());

process.on('uncaughtException', function (err) {

	console.log(err.stack);

	process.send({
		type: constants.runner_message_type.FATAL,
		data: {
			msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
			'\n (note: You will need to transpile your test files if you wish to use ES7 features)',
			error: err.stack
		}
	});

	console.log(' => Suman => Uncaught exception in your test =>', '\n', err.stack + '\n\n');
	process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

///////////////////////////////////////
debugger;
///////////////////////////////////////

const babelarg = process.argv.indexOf('--register') > -1;
const filePath = global._sFilePath = process.argv[process.argv.indexOf('--fp') + 1];

const sumanConfig = global.sumanConfig = JSON.parse(process.argv[process.argv.indexOf('--suman-config') + 1]);
const sumanHelperDirRoot = global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

if (babelarg) {
	require('babel-core/register')({
		ignore: /node_modules/
	});
}

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

d.run(function () {
	process.nextTick(function () {
		require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
		require(filePath);
	});
});