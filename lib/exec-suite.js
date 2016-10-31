/**
 * Created by denman on 11/24/15.
 */


//TODO: as we know which file or directory the user is running their tests, so error stack traces should only contain those paths
//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production
//TODO: plugins http://hapijs.com/tutorials/plugins

//#core
const domain = require('domain');
const path = require('path');
const assert = require('assert');
const EE = require('events');
const fs = require('fs');

//#npm
const colors = require('colors/safe');
const async = require('async');
const _ = require('underscore');
const fnArgs = require('function-arguments');
const chalk = require('chalk');

//#project
const constants = require('../config/suman-constants');
const sumanUtils = require('./utils');
const makeGracefulExit = require('./make-graceful-exit');
const incr = require('./incrementer');
const handleExtraOpts = require('./handle-extra-opts');
const originalAcquireDeps = require('./acquire-deps-original');
const acquireDepsFillIn = require('./acquire-deps-fill-in');

////////////////////////////////////////////////////////////////////

module.exports = {

    main: function main(suman) {

        suman.dateSuiteStarted = Date.now();

        // const ee = new EE();

        const errors = [];
        const testErrors = [];
        const allDescribeBlocks = suman.allDescribeBlocks;

        const gracefulExit = makeGracefulExit(suman, errors);

        const ts = require('./TestSuite')(suman, gracefulExit, testErrors);
        const Maker = ts.Maker;

        function makeSuite(desc, opts, cb, argz, writable, $ioc) {

            const obj = handleExtraOpts.handleOptsWithExtraAndWritable.apply(global, arguments);

            desc = obj.desc;
            opts = obj.opts;
            cb = obj.cb;
            argz = obj.extra;
            writable = obj.writable;
            // $ioc = obj.ioc;
            suman.desc = desc;

            if (sumanUtils.isArrowFunction(cb) || sumanUtils.isGeneratorFn(cb)) { //TODO: send this error to runner?

                const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;

                if (global.usingRunner) {
                    process.send({
                        type: constants.runner_message_type.FATAL,
                        data: {
                            errors: [msg],
                            msg: msg
                        }
                    });
                }
                console.log(msg + '\n\n');
                console.error(new Error(' => Suman error => invalid arrow/generator function usage.').stack);
                return process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            }

            if (global.sumanOpts.grepSuite && !(String(desc).search(global.sumanOpts.grepSuite) > -1)) {
                console.log(' => Suman warning => --grep-suite option was passed with value: ' + global.sumanOpts.grepSuite + 'and this didnt match the suite description with value:' + desc);
                if (global.usingRunner) {
                    process.send({
                        type: constants.runner_message_type.FATAL_SOFT,
                        data: {
                            msg: ' --grep-suite command line option didnt match test suite description:\n' +
                            ' --grep-suite=' + suman.grepSuite + ' description=' + desc
                        }
                    });
                }

                return process.exit(constants.EXIT_CODES.GREP_SUITE_DID_NOT_MATCH);
            }

            const deps = suman.deps = fnArgs(cb);
            const lngth = Number(deps.length);
            const delayOptionElected = opts.delay;
            const indexOfExtra = deps.indexOf('extra');
            const indexOfWritable = deps.indexOf('writable');

            //TODO: we need to warn the user when the give an option to describe or it that is not recognized

            var suite = Maker.new({
                desc: desc,
                isTopLevel: true,
                opts: opts
            });

            suite.__bindExtras();
            allDescribeBlocks.push(suite);

            try {
                const globalHooks = require(path.resolve(global.sumanHelperDirRoot + '/suman.hooks.js'));
                assert(typeof globalHooks === 'function', 'suman.hooks.js must export a function.');
                globalHooks.apply(suite, [suite]);
            }
            catch (err) {
                console.error('\n', err.stack, '\n\n');
            }

            if (deps.length < 1) {
                process.nextTick(function () {
                    startWholeShebang([]);
                });
            }
            else {

                const d = domain.create();
                d._sumanStart = true;

                d.once('error', function (err) {

                    d.exit();
                    err = new Error(' => Suman error => Error acquiring IOC deps => \n' + err.stack);
                    err.sumanFatal = true;
                    err.sumanExitCode = constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                    gracefulExit([err]);

                });

                d.run(function () {

                    process.nextTick(function () {

                        originalAcquireDeps(deps, function (err, deps) {

                            if (err) {
                                console.log(err.stack || err);
                                process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                            }
                            else {

                                acquireDepsFillIn(suite, deps, function (err, deps) {
                                    if (err) {
                                        throw err;
                                    }
                                    else {
                                        d.exit();

                                        process.nextTick(function () {
                                            startWholeShebang(deps);
                                        });

                                    }
                                });

                            }
                        });

                    });

                });

            }

            //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

            function startWholeShebang(deps) {

                const d = domain.create();
                d._sumanStartWholeShebang = true;

                d.once('error', function (err) {

                    // console.log(' => Domain caught => ', err.stack);
                    d.exit();
                    err.sumanFatal = true;
                    err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_ROOT_SUITE;
                    gracefulExit([err]);
                });

                d.run(function () {

                        process.nextTick(function () {

                            if (indexOfExtra >= 0) {
                                deps.splice(indexOfExtra, 0, argz);
                            }

                            if (indexOfWritable >= 0) {
                                deps.splice(indexOfWritable, 0, writable);
                            }

                            suite.fatal = function (err) {
                                err = err || new Error('Fatal error experienced in root suite.');
                                console.log(err.stack);
                                err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                gracefulExit(err);
                            };

                            if (delayOptionElected) {

                                suite.__proto__.isDelayed = true;

                                const to = setTimeout(function () {
                                    console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
                                    process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                                }, global.weAreDebugging ? 500000 : 11000);

                                if (global.sumanOpts.verbose) {
                                    console.log(' => Waiting for delay() function to be called...');
                                }

                                var callable = true;
                                suite.resume = function (val) {
                                    if (callable) {
                                        callable = false;
                                        clearTimeout(to);
                                        process.nextTick(function () {
                                            suite.__proto__.isSetupComplete = true; // keep this, needs be called asynchronously
                                            suite.__invokeChildren(val, start); //pass start function all the way through program until last child delay call is invoked!
                                        });
                                    }
                                    else {
                                        console.error(' => Suman usage warning => suite.resume() was called more than once.');
                                    }
                                };

                                const str = cb.toString();

                                if (!sumanUtils.checkForValInStr(str, /resume/g, 0)) { //TODO this will not work when delay is simply commented out
                                   process.nextTick(function(){
                                       console.error(new Error(' => Suman usage error => suite.resume() method needs to be called to continue,' +
                                               ' but the resume method was never referenced, so your test cases would never be invoked before timing out.').stack
                                           + '\n =>' + str);
                                       process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                                   });
                                }
                                else {
                                    cb.apply(suite, deps);
                                }
                            }
                            else {

                                suite.resume = function () {
                                    console.error(' => Suman usage warning => suite.resume() has become a noop since delay option is falsy.');
                                };
                                cb.apply(suite, deps);
                                suite.__proto__.isSetupComplete = true;
                                process.nextTick(function () {
                                    suite.__invokeChildren(null, start); //pass start function all the way through program until last child delay call is invoked!
                                });
                            }
                        });

                    }
                );

            }

            function start() {

                // const timeoutVal = global.weAreDebugging ? 50000000 : (global.sumanConfig.defaultTestSuiteTimeout || 100000);

                const timeoutVal = 50000000;

                const to = setTimeout(function () {
                    //note: this timer is necessary so that a test suite will timeout and allow blocked processes to run
                    console.error('\n\n', colors.red(' => Suman fatal error => Suite timed out after ' + timeoutVal + ' seconds.'));
                    process.exit(constants.EXIT_CODES.SUITE_TIMEOUT);

                }, timeoutVal);

                // var count = 0;
                //
                // ee.on('test_complete', function handleCompleteTest() {
                //     count++;
                // });

                function runSuite(suite, cb) {

                    const fn = suite.parallel ? async.each : async.eachSeries;

                    suite.__startSuite(function (err, results) {

                        if (err) {
                            console.error('test error data before log:', suite);
                        }

                        // ee.emit('test_complete', suite);
                        suman.logData(suite);

                        //TODO: this might be wrong, may need to omit filter
                        const children = suite.getChildren().filter(function (child) {
                            return !child.skipped;
                        });

                        if (children.length < 1) {
                            process.nextTick(cb)
                        }
                        else {
                            fn(children, function (child, cb) {

                                child = _.findWhere(allDescribeBlocks, {
                                    testId: child.testId
                                });

                                runSuite(child, cb);

                            }, function (err, results) {
                                process.nextTick(cb);
                            });
                        }
                    });
                }

                runSuite(allDescribeBlocks[0], function complete() {

                    suman.dateSuiteFinished = Date.now();

                    try {
                        clearInterval(interval);  //TODO: what happened to interval
                        clearTimeout(to);
                    }
                    catch (err) {
                    }
                    finally {

                        suman.sumanCompleted = true;

                        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
                            debugger;
                            suman._sumanEvents.emit('suman-test-file-complete');
                        }
                        else {

                            suman.logFinished(0, function (err, val) {

                                // note that exit code should probably not depend on once-post
                                global.suiteResultEmitter.emit('suman-completed', val);
                                // setImmediate(function () {
                                //     // suman.makeExit(exitCode);
                                // });

                            });
                        }
                    }
                });

            }
        }

        return makeSuite;
    }
}
;
