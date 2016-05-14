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
            type: constants.runner_message_type.FATAL,
            data: {
                error: msg,
                msg: msg
            }
        });
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
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
const makeGracefulExit = require('./make-graceful-exit');
const handleExit = require('./handle-exit');
const incr = require('./incrementer');
const makeHandleExtraOpts = require('./handle-extra-opts');

////////////////////////////////////////////////////////////////////


module.exports = {

    main: function main(suman) {

        suman.dateSuiteStarted = Date.now();
        const ee = new EE();

        const errors = [];
        const testErrors = [];
        const allDescribeBlocks = suman.allDescribeBlocks;

        handleExit(suman, testErrors, errors);

        const handleExtraOpts = makeHandleExtraOpts(suman, ee);
        const gracefulExit = makeGracefulExit(suman, errors, ee);

        const ts = require('./TestSuite')(suman, gracefulExit, testErrors, ee);
        const Maker = ts.Maker;

        var maxMem = global.maxMem = {
            heapTotal: 0,
            heapUsed: 0
        };

        var interval = global.sumanConfig.checkMemoryUsage ? setInterval(function () {

            const m = process.memoryUsage();
            if (m.heapTotal > maxMem.heapTotal) {
                maxMem.heapTotal = m.heapTotal;
            }
            if (m.heapUsed > maxMem.heapUsed) {
                maxMem.heapUsed = m.heapUsed;
            }

        }, 5) : null;


        function makeSuite(desc, opts, cb, argz, writable, $ioc) {

            const obj = handleExtraOpts.handleOptsWithExtraAndWritable.apply(global, arguments);

            desc = obj.desc;
            opts = obj.opts;
            cb = obj.cb;
            argz = obj.extra;
            writable = obj.writable;
            $ioc = obj.ioc;
            suman.desc = desc;

            if (utils.isArrowFunction(cb) || utils.isGeneratorFn(cb)) { //TODO: send this error to runner?

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
            const indexOfDelay = deps.indexOf('delay');
            const indexOfExtra = deps.indexOf('extra');
            const indexOfWritable = deps.indexOf('writable');

            //TODO: we need to warn the user when the give an option to describe or it that is not recognized

            var suite = Maker.new({
                desc: desc,
                isTopLevel: true,
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
                    console.error(err.stack);
                    err.sumanFatal = true;
                    err.sumanExitCode = constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                    process.nextTick(function () {
                        gracefulExit([err]);
                    });

                });

                d.run(function () {

                    process.nextTick(function () {

                        var ioc;

                        try {
                            //TODO: need to update this
                            ioc = require(path.resolve(process.cwd() + '/suman/suman.ioc.js'));
                        }
                        catch (err) {
                            try {
                                ioc = require(path.resolve(utils.findProjectRoot(process.cwd()) + '/suman/suman.ioc.js'));
                            } catch (err) {
                                console.log(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.\n');
                                ioc = require(path.resolve(__dirname + '/../default-conf-files/suman.default.ioc.js'));
                            }
                        }

                        suman.iocConfiguration = ioc();
                        suman.acquire($ioc, function (err, deps) {

                            if (err) {
                                console.log(err.stack);
                                // throw err; //TODO: udpate this perhaps
                                process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                            }
                            else {

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
                    console.log(err.stack);
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

                        if (indexOfDelay >= 0) {

                            suite.__proto__.isDelayed = true;

                            const to = setTimeout(function () {
                                console.log(' => Suman fatal error => delay function was not called within alloted time.');
                                process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                            }, global.weAreDebugging ? 500000 : 7000);

                            deps.splice(indexOfDelay, 0, function delay(err) {
                                clearTimeout(to);
                                if (err) {
                                    console.log(err.stack);
                                    err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                    gracefulExit(err);
                                }
                                else {
                                    process.nextTick(function () { //need to make sure delay is called asynchronously, but this should take care of it
                                        suite.__proto__.isSetupComplete = true;
                                        suite.__invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                                    });
                                }
                            });

                            if (!utils.checkForValInStr(cb.toString(), /delay/g)) { //TODO this will not work when delay is simply commented out
                                console.error(new Error('delay function injected into test suite, but the delay function was never referenced, so your test suite would never be invoked.').stack);
                                process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                            }
                            else {
                                cb.apply(suite, deps);
                            }
                        }
                        else {
                            cb.apply(suite, deps);
                            process.nextTick(function () {
                                suite.__proto__.isSetupComplete = true;
                                suite.__invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                            });
                        }
                    });

                });

            }


            function start() {

                const to = setTimeout(function () {
                    //note: this timer is necessary so that a test suite will timeout and allow blocked processes to run
                    // suman.logFinished();
                    // setImmediate(function () {
                    //     //note: this could just be invoked using process.on('exit'),
                    //     //but we need to force an exit if the user puts in extraneous timers
                    //     suman.makeExit(constants.EXIT_CODES.SUITE_TIMEOUT);
                    // });
                    console.error(' => Suman fatal error => Suite timed out.');
                    process.exit(constants.EXIT_CODES.SUITE_TIMEOUT);

                }, global.weAreDebugging ? 50000000 : (global.sumanConfig.defaultTestSuiteTimeout || 100000));  //100 seconds

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

                        global.sumanCompleted = true;
                        const exitCode = suman.logFinished();

                        setImmediate(function () {
                            //note: this could just be invoked using process.on('exit'),
                            //but we need to force an exit if the user puts in extraneous timers
                            suman.makeExit(exitCode);
                        });
                    }
                });

            }

        }


        return makeSuite;
    }
};
