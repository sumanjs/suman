/**
 * Created by Olegzandr on 6/4/16.
 */


const path = require('path');

const root = global.projectRoot;
const sumanConfig = global.sumanConfig;

const sumanHelperDirRoot = global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

function run(file) {

	require('./patch-process.stdout.write');
	require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //import globals
	require(file);

}

module.exports = run;

