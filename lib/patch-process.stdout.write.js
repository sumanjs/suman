/**
 * Created by Olegzandr on 6/4/16.
 */



//core
const fs = require('fs');
const path = require('path');

//project
const orig = process.stdout.write;

const strm = fs.createWriteStream(path.resolve(global.sumanHelperDirRoot + '/logs/test-stdout.log'));

process.stdout.write = function write() {

	orig.apply(process.stdout, arguments);

	//TODO: if this file was not run as the result of '--watch' flag, or in other words, if this file was run directly by user
	// then we don't need to output to log file, so replace "true" below with this condition

	if (!global.usingRunner && true) {
		strm.write.apply(strm, arguments);
	}

};