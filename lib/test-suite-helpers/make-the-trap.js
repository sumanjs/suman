/**
 * Created by denman on 3/13/2016.
 */


//#core
const domain = require('domain');

//#npm
const async = require('async');

//#project
const makeHandleTestResults = require('./handle-test-result');
const handleTest = require('./handle-test');
const makeAllEaches = require('../get-all-eaches');
const makeHandleBeforeOrAfterEach = require('./make-handle-each');

module.exports = function makeTheTrap(suman, gracefulExit) {

	const allDescribeBlocks = suman.allDescribeBlocks;
	const handleTestResult = makeHandleTestResults(suman);
	const allEachesHelper = makeAllEaches(suman, allDescribeBlocks);
	const handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);

	return function runTheTrap(self, test, opts, cb) {

		var delaySum = 0; //TODO: is this correct?

		//TODO: why not run only check earlier?
		if (test.skipped || test.stubbed) {
			process.nextTick(function () {
				cb(null, []);   //TODO: add skipped call
			});
			return;
		}

		const parallel = opts.parallel;

		async.mapSeries(allEachesHelper.getAllBeforesEaches(self), function (aBeforeEach, cb) {
				handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
			},
			function doneWithBeforeEaches(err, results) {

				gracefulExit(results, function () {

					if (parallel) {
						delaySum += (test.delay || 0);
					} else {
						delaySum = 0;
					}

					async.series([
							function (cb) {

								function handleTestContainer() {
									handleTest(self, test, function (err, result) {
										gracefulExit(handleTestResult(result, test), function () {
											cb(null, result);
										});
									});
								}

								if (delaySum) { // if non-zero / non-falsy value
									setTimeout(handleTestContainer, delaySum);
								}
								else {
									handleTestContainer();
								}

							},

							function (cb) {

								async.mapSeries(allEachesHelper.getAllAfterEaches(self), function (aAfterEach, cb) {
									handleBeforeOrAfterEach(self, test, aAfterEach, cb);
								}, function done(err, results) {
									gracefulExit(results, function () {
										cb(null);
									});
								});

							}
						],
						function doneWithTests(err, results) {
							cb(null, results);
						})
				});
			});
	}

};