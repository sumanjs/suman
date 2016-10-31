'use strict';

//core
const EE = require('events');
const util = require('util');

//npm
const async = require('async');


function run(files) {

    async.eachSeries(files, function (f, cb) {

            const fullPath = f[0];
            const shortenedPath = f[1];

            debugger;

            const events = require(fullPath);

            events
                .once('suman-test-file-complete', function () {
                    cb(null);
                })
                .once('test', function (test) {
                    console.log('\n\n', ' => Suman is now running test with filename => [' + shortenedPath + ']');
                    test.apply(null);
                })
                .once('error', function (e) {
                    console.log(e.stack || e);
                    cb(e);
                })

        },
        function (err, results) {

            if (err) {
                console.error(err.stack || err);
                process.exit(1);
            }
            else {
                console.log('\n\n => Suman message => SUMAN_SINGLE_PROCESS run is now complete =>\n\n' +
                    ' => Time required for all tests in single process => ', Date.now() - global.sumanSingleProcessStartTime);

                process.exit(0);
            }

        });

}

module.exports = run;

