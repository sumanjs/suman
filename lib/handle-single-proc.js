'use strict';

//core
const EE = require('events');
const util = require('util');
const assert = require('assert');
const domain = require('domain');

//npm
const async = require('async');
const _ = require('lodash');


//project
const constants = require('../config/suman-constants');
const acquireDeps = require('./acquire-deps');
const sumanUtils = require('suman-utils/utils');

//////////////////////////////////


function sumanSingleProcessPre(cb) {

    debugger;

    const integrantsEmitter = global.integrantsEmitter = global.integrantsEmitter || [];

    //TODO: may want to do better with global.integPath
    const depContainerObj = global.integPath({temp: 'we are in suman project => lib/index.js'});

    const d = domain.create();

    d.once('error', function (err) {

        err = new Error(' => Suman fatal error => there was a problem verifying integrants \n' + err.stack);

        if (global.usingRunner) {
            process.send({
                type: constants.runner_message_type.FATAL,
                data: {
                    msg: err.stack,
                    stack: err.stack
                }
            });
        }

        console.error(err.stack || err);
        global._writeTestError(err.stack || err);
        process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
    });


    d.run(function () {
        process.nextTick(function () {
            acquireDeps(_.flattenDeep(global.oncePreKeys), depContainerObj, sumanUtils.onceAsync(null, function (err, vals) {
                d.exit();
                process.nextTick(function(){
                    if (err) {
                        console.error(err.stack || err);
                        process.exit(constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION);
                    }
                    else {
                        cb(null, vals);
                    }
                });

            }));
        });
    });
}


function run(files) {

    files = files.map(function (f) {
        const _testsuites = require(f[0])._testsuites;
        assert(Array.isArray(_testsuites), ' => Suman usage error => Test file did not properly export "_testsuites" array. ' +
            'Please report an issue, you may not figure this one out quickly.');
        f._testsuites = _testsuites;
        return f;
    });

    sumanSingleProcessPre(function (err, vals) {

        //ignore err;

        if (err) {
            console.error(err.stack | err);
            return process.exit(constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION);
        }

        async.eachSeries(files, function (f, cb) {

                const fullPath = f[0];
                const shortenedPath = f[1];

                debugger;

                const _testsuites = f._testsuites;

                console.log('\n\n', ' => Suman is now running testsuites for filename => [' + shortenedPath + ']');

                async.each(_testsuites, function (item, cb) {

                    var callable = true;
                    const first = function () {
                        if (callable) {
                            item.removeAllListeners();
                            callable = false;
                            cb.apply(null, arguments);
                        }
                        else {
                            console.error(' => Suman warning => SUMAN_SINGLE_PROCESS callback fired more than once, ' +
                                'here is the data passed to callback => ', util.inspect(arguments));
                        }

                    };

                    //TODO: once one callback is fired, should remove other listeners
                    item
                        .once('suman-test-file-complete', function () {
                            first(null);
                        })
                        .once('test', function (test) {
                            test.apply(null);
                        })
                        .once('error', function (e) {
                            console.log(e.stack || e);
                            first(e);
                        });

                    item.emit('vals', vals);

                }, cb);

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

    });


}

module.exports = run;

