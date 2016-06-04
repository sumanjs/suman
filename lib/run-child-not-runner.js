/**
 * Created by Olegzandr on 6/4/16.
 */


const path = require('path');

function run(file) {

	require(path.resolve(global.sumanHelperDirRoot + '/suman.globals.js'));  //import globals
	require(file);

}

module.exports = run;

