/**
 * Created by amills on 6/14/16.
 */


const EE = require('events');
const async = require('async');
global.sumanSingleProcEvents = new EE();

function run(files) {

	async.eachSeries(files, function (f, cb) {

		const fullPath = f[0];
		const shortenedPath = f[1];

		console.log('\n', '[' + shortenedPath + ']');

		require(fullPath)
			.on('suman-test-file-complete', function () {
				cb(null);
			})
			.on('test', function (test) {
				test.apply(null);
			});

	}, function (err, results) {

		console.log('\n\nVeERY MUCH COMPLETE => time required', Date.now() - global.sumanSingleProcessStartTime);
		process.exit(0);

	});

}

module.exports = run;

