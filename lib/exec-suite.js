/**
 * Created by denman on 11/24/15.
 */


//TODO: as we know which file or directory the user is running their tests, so error stack traces should only contain those paths
//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production
//TODO: plugins http://hapijs.com/tutorials/plugins


process.on('uncaughtException', function (err) {
    const msg = err.stack || err;
    console.error(' => Suman uncaughtException => ', msg);
    if (process.send) {
        //TODO: this is not necessarily fatal
        process.send({
            type: 'FATAL',
            data: {
                error: msg,
                msg: msg
            }
        });
    }
});


//#core
const domain = require('domain');
const path = require('path');
const assert = require('assert');
const EE = require('events');


//#npm
const async = require('async');
const _ = require('underscore');
const fnArgs = require('function-arguments');
const chalk = require('chalk');


//#project
const constants = require('../config/suman-constants');
const debugCore = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');
const utils = require('./utils');
const makeHandleUncaughtException = require('./handle-uncaught-exception')();
const makeGracefulExit = require('./make-graceful-exit');
const handleExit = require('./handle-exit');
const handleArgs = require('./handle-args');
const incr = require('./incrementer');
const makeSuiteLite = require('./make-suite-lite');
const makeHandleExtraOpts = require('./handle-extra-opts');


////////////////////////////////////////////////////////////////////

const weAreDebugging = require('./debugging-helper/we-are-debugging');


module.exports = {

    main: function main(suman) {

        suman.dateSuiteStarted = Date.now();
        const ee = new EE();

        const errors = [];
        const testErrors = [];
        const allDescribeBlocks = suman.allDescribeBlocks;

        handleExit(suman, testErrors, errors);
        handleArgs(suman);

        const handleExtraOpts = makeHandleExtraOpts(suman, ee);
        const gracefulExit = makeGracefulExit(suman, errors, ee);

        const ts = require('./TestSuite')(suman, gracefulExit, testErrors, ee);
        const Maker = ts.Maker;

        var maxMem = suman.maxMem = {
            heapTotal: 0,
            heapUsed: 0
        };

        var interval = suman.config.checkMemoryUsage ? setInterval(function () {

            var m = process.memoryUsage();
            if (m.heapTotal > maxMem.heapTotal) {
                maxMem.heapTotal = m.heapTotal;
            }
            if (m.heapUsed > maxMem.heapUsed) {
                maxMem.heapUsed = m.heapUsed;
            }

        }, 5) : null;


        function makeSuite(desc, opts, cb, argz) {

            const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

            desc = obj.desc;
            opts = obj.opts;
            cb = obj.cb;

            suman.desc = desc;

            if (utils.isArrowFunction(cb)) { //TODO: send this error to runner?

                const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;

                if (process.send) {
                    process.send({
                        type: 'FATAL',
                        data: {
                            errors: [msg],
                            msg: msg
                        }
                    });
                }
                console.error(' => Suman error => invalid arrow function usage.');
                console.error(msg);
                process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
                return;
            }

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log(' => Suman warning => --grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                if (process.send) {
                    process.send({
                        type: 'FATAL_SOFT',
                        data: {
                            msg: ' --grep-suite command line option didnt match test suite description:\n' +
                            ' --grep-suite=' + suman.grepSuite + ' description=' + desc
                        }
                    });
                }

                process.exit(constants.EXIT_CODES.GREP_SUITE_DID_NOT_MATCH);

            } else {

                const deps = suman.deps = fnArgs(cb);

                const lngth = Number(deps.length); //copy value
                const indexOfDelay = deps.indexOf('delay');
                const indexOfExtra = deps.indexOf('extra');

                //TODO: we need to warn the user when the give an option to describe or it that is not recognized

                var suite = Maker.new({
                    desc: desc,
                    isTopLevel: true,
                    parallel: opts.parallel,
                    opts: opts
                });

                suite.__bindExtras(suite);
                allDescribeBlocks.push(suite);

                if (deps.length > 0) {

                    const d = domain.create();
                    d._sumanStart = true;

                    d.once('error', function (err) {

                        d.exit();
                        err = new Error(' => Suman error => Error acquiring IOC deps => \n' + err.stack);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                        process.nextTick(function () {
                            gracefulExit([err]);
                        });

                    });

                    d.run(function () {

                        //assert(suman.config.ioc, 'No IoC path'); //TODO, check for ioc path
                        process.nextTick(function () {

                            var ioc;

                            try {
                                //TODO: need to update this
                                ioc = require(path.resolve(process.cwd() + '/' + suman.config.ioc));
                            }
                            catch (err) {
                                try {
                                    ioc = require(path.resolve(utils.findProjectRoot(process.cwd()) + '/' + suman.config.ioc));
                                } catch (err) {
                                    console.error(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.\n');
                                    ioc = require(path.resolve(__dirname + '/../default-conf-files/suman.default.ioc.js'));
                                }
                            }

                            ioc(suman);

                            suman.acquire(function (err, deps) {

                                if (err) {
                                    console.error(err.stack);
                                    throw err;
                                }
                                else {

                                    //assert(Array.isArray(deps), 'deps from IoC is not an array.');

                                    const $deps = [];
                                    Object.keys(deps).forEach(function (key, index) {  //iterate over original array

                                        const dep = deps[key];

                                        if (dep) {
                                            $deps.push(dep);
                                        }
                                        else if (_.contains(constants.CORE_MODULE_LIST, key)) {
                                            $deps.push(require(key))
                                        }
                                        else if (_.contains(constants.SUMAN_HARD_LIST, key)) {
                                            switch (key) {
                                                case 'suite':
                                                    $deps.push(suite);
                                            }
                                        }
                                        else {
                                            throw new Error('Dependency not met:' + key);
                                        }


                                    });

                                    startWholeShebang($deps);
                                }
                            });

                        });

                    });

                } else {
                    startWholeShebang([]);
                }

                //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

                function startWholeShebang(deps) {


                    const d = domain.create();
                    d._sumanStartWholeShebang = true;

                    d.once('error', function (err) {
                        d.exit();
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_ROOT_SUITE;
                        process.nextTick(function () {
                            gracefulExit([err]);
                        });
                    });


                    d.run(function () {

                        process.nextTick(function () {

                            if(indexOfExtra >= 0){
                                deps.splice(indexOfExtra, 0, argz);
                            }

                            if (indexOfDelay >= 0) {

                                suite.__proto__.isDelayed = true;
                                deps.splice(indexOfDelay, 0, function delay(err) {
                                    if (err) {
                                        console.error(err.stack);
                                    }
                                    else {
                                        process.nextTick(function () { //need to make sure delay is called asynchronously, but this should take care of it
                                            suite.__proto__.isSetupComplete = true;
                                            suite.__invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                                        });
                                    }
                                });

                                if (!utils.checkForValInStr(cb.toString(), /delay/g)) { //TODO this will not work when delay is simply commented out
                                    throw new Error('delay function injected into test suite, but the delay function was never referenced, so your test suite would never be invoked.');
                                }

                                cb.apply(suite, deps);
                            }
                            else {
                                cb.apply(suite, deps);
                                suite.__proto__.isSetupComplete = true;
                                suite.__invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                            }
                        });

                    });

                }


                function start() {

                    const to = setTimeout(function () { //TODO this timer is necessary so that a test suite will timeout and allow blocked processes to run
                        process.exit(constants.EXIT_CODES.SUITE_TIMEOUT);
                    }, weAreDebugging ? 50000000 : (suman.config.defaultTestSuiteTimeout || 100000));  //100 seconds

                    var count = 0;
                    var num = allDescribeBlocks.length;

                    ee.on('test_complete', function handleCompleteTest() {
                        count++;
                    });


                    function runSuite(suite, cb) {

                        const fn = suite.parallel ? async.each : async.eachSeries;

                        suite.__startSuite(function (err, results) {

                            if (err) {
                                console.error('test error data before log:', suite);
                            }

                            ee.emit('test_complete', suite);
                            suman.logData(suite);

                            //TODO: this might be wrong, may need to omit filter
                            const children = suite.getChildren().filter(function (child) {
                                return !child.skipped;
                            });

                            fn(children, function (child, cb) {

                                child = _.findWhere(allDescribeBlocks, {
                                    testId: child.testId
                                });

                                runSuite(child, cb);

                            }, function (err, results) {
                                cb();
                            });
                        });

                    }

                    runSuite(allDescribeBlocks[0], function complete() {

                        if (process.env.NODE_ENV === 'dev_local_debug') {
                            console.log('complete');
                        }

                        suman.dateSuiteFinished = Date.now();

                        try {
                            clearInterval(interval);
                            clearTimeout(to);
                        }
                        catch (err) {
                        }
                        finally {
                            //we need to wait for all messages sent to
                            const exitCode = suman.logFinished();

                            setImmediate(function () {
                                //note: this could just be invoked on('exit'), but we need to force an exit if the user puts in extraneous timers
                                suman.makeExit(exitCode);
                            });
                        }
                    });


                    //async.eachSeries(allDescribeBlocks, function (test, cb) {
                    //    process.nextTick(function () {
                    //        var called = 0;
                    //        test.__startSuite(function (err, results) {
                    //            if (called < 1) {
                    //                called++;
                    //                if (err) {
                    //                    console.error('test error data before log:', test);
                    //                }
                    //                suman.logData(test);
                    //                cb(null);
                    //            }
                    //            else {
                    //                if (called > 1) {
                    //                    console.error('TestSuite callback fired more than twice =>', JSON.stringify(test));
                    //                }
                    //            }
                    //        });
                    //    });
                    //}, function complete() {
                    //    clearInterval(interval);
                    //});
                }
            }
        }


        return makeSuite;
    }
};
