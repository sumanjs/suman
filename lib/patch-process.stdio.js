/**
 * Created by Olegzandr on 6/4/16.
 */



//core
const fs = require('fs');
const path = require('path');

//project
const origStdout = process.stdout.write;
const origStderr = process.stderr.write;

// const strm = fs.createWriteStream(path.resolve(global.sumanHelperDirRoot + '/logs/test-stdout.log'));
// strm.write('test start:' + new Date());

//if this process was kicked off via a watcher, then we send stderr and stdout both to the test.log file
const isViaSumanWatch = process.env.SUMAN_WATCH === 'yes';

/*process.stderr.write = function write() {

	origStderr.apply(process.stderr, arguments);

	//TODO: if this file was not run as the result of '--watch' flag, or in other words, if this file was run directly by user
	// then we don't need to output to log file, so replace "true" below with this condition
	if (!global.usingRunner && isViaSumanWatch) {
		strm.write.apply(strm, arguments);
	}

};

process.stdout.write = function write() {

	origStdout.apply(process.stdout, arguments);

	//TODO: if this file was not run as the result of '--watch' flag, or in other words, if this file was run directly by user
	// then we don't need to output to log file, so replace "true" below with this condition
	if (!global.usingRunner && isViaSumanWatch) {
		strm.write.apply(strm, arguments);
	}

};*/

