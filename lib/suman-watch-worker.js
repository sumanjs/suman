//pre-load as many modules as possible :)

process.on('message', function (m) {

	const fp = m.msg.testPath;

	if (process.env.SUMAN_DEBUG === 'yes') {

		console.log('in poolio worker, message:', m);

		console.log('here are process.argv args:\n');
		process.argv.forEach((val, index, array) => {
			console.log(`${index}: ${val}`);
		});
	}

	// process.argv.push('--runner');
	process.argv.push(fp);

	require('../index');

});

//pre-load most likely files necessary, this saves milliseconds, but why not
require('./pre-load-these/pre-load');


