/**
 * Created by denman on 11/24/15.
 */


//TODO: as we know which file or directory the user is running their tests, so error stack traces should only contain those paths
//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production
//TODO: plugins http://hapijs.com/tutorials/plugins


process.on('uncaughtException', function (err) {
    var msg = err.stack || err;
    console.error(msg);
    if (process.send) {
        process.send({
            error: msg,
            msg: msg,
            type: 'FATAL',
            fatal: true
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

        const ee = new EE();

        const errors = [];
        const testErrors = [];
        const allTests = [];

        handleExit(suman, testErrors, errors);
        handleArgs(suman);

        const handleExtraOpts = makeHandleExtraOpts(suman, ee);
        const gracefulExit = makeGracefulExit(suman, errors, ee);

        const ts = require('./TestSuite')(suman, allTests, gracefulExit, testErrors, ee);
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


        function makeSuite(desc, opts, deps, cb) {

            const obj = handleExtraOpts.handleOptsWithDeps(desc, opts, deps, cb);

            desc = obj.desc;
            opts = obj.opts;
            deps = obj.deps;
            cb = obj.cb;

            if (utils.isArrowFunction(cb)) { //TODO: send this error to runner?
                var msg = 'You cannot use an arrow function with describe callbacks; however, you may use arrow functions everywhere else.\n' +
                    'The reason is because every describe call creates a new nested test instance, and "this" is bound to that instance. \nFor every describe call, you ' +
                    'need a regular function as a callback. The remainder of your tests can be arrow function galore. \nIf you dont understand this, read up on how arrow functions bind "this" ' +
                    'to lexical scope, and why they cant just be used everywhere.\n\n'
                if (process.send) {
                    process.send({
                        errors: [],
                        msg: msg,
                        type: 'FATAL',
                        fatal: false
                    });
                }
                console.error(' => Suman error => invalid arrow function usage.');
                process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
                return;
            }

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log(' => Suman warning => --grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                if (process.send) {
                    process.send({
                        msg: ' --grep-suite command line option didnt match test suite description:' +
                        ' --grep-suite=' + suman.grepSuite + ' description=' + desc,
                        type: 'FATAL_SOFT',
                        fatal: false
                    });
                }

                process.exit(0);

            } else {

                suman.deps = deps;
                const args = fnArgs(cb);

                if (suman.deps.length > args.length) {
                    var warning = 'You have more dependencies listed in the dep array than those injected into the callback';
                    if (process.send) {
                        process.send({
                            errors: [],
                            msg: warning,
                            type: 'WARNING',
                            fatal: false
                        });
                    } else {
                        console.log('Suman warning: ' + warning);
                    }
                }


                var lngth = Number(suman.deps.length); //copy value

                for (var i = lngth; i < args.length; i++) {
                    suman.deps.push(String(args[i]));
                }

                var indexOfDelay = suman.deps.indexOf('delay');


                //TODO: we need to warn the user when the give an option to describe or it that is not recognized

                var suite = Maker.new({
                    desc: desc,
                    isTopLevel: true,
                    parallel: opts.parallel,
                    opts: opts
                });

                suite.__bindExtras(suite);
                allTests.push(suite);

                if (deps.length > 0) {
                    const d = domain.create();
                    d._suman_start = true;
                    d.on('error', function (err) {
                        d.exit();
                        process.nextTick(function () {
                            if (typeof process.send === 'function') {
                                console.error('_suman_start:', err.stack);
                                process.send({
                                    error: msg,
                                    msg: msg,
                                    type: 'FATAL',
                                    fatal: true
                                });
                            } else {
                                console.error(' => Suman error => ' + err.stack);
                            }
                            gracefulExit([err]);
                        });
                    });

                    d.run(function () {

                        //assert(suman.config.ioc, 'No IoC path'); //TODO, check for ioc path

                        var ioc;
                        try {
                            //TODO: need to update this
                            ioc = require(path.resolve(process.cwd() + '/' + suman.config.ioc));
                        } catch (err) {
                            try {
                                ioc = require(path.resolve(utils.findProjectRoot(process.cwd()) + '/' + suman.config.ioc));
                            } catch (err) {
                                console.error(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.\n');
                                ioc = require(path.resolve(__dirname + '/../suman.default.ioc.js'));
                            }
                        }

                        ioc(suman); //TODO: need to add domain to this?

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

                } else {
                    startWholeShebang([]);
                }

                //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

                function startWholeShebang(deps) {


                    const d = domain.create();
                    d._suman_start_whole_shebang = true;

                    d.on('error', function (err) {
                        console.error('startWholeShebang:', err.stack);
                        d.exit();
                        if (typeof process.send === 'function') {
                            process.send({
                                msg: 'fatal error',
                                error: err.stack,
                                type: 'FATAL'
                            })
                        }
                        else {
                            console.error(' => Suman error => ', err.stack);

                        }
                        console.error(err.stack);
                        gracefulExit([err]);
                    });


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


                    if (!process.send) {
                        debugCore('attempting to run X number of tests...');
                    }
                }

                const to = setTimeout(function () { //TODO this timer is necessary so that a test suite will timeout and allow blocked processes to run
                    process.exit(constants.EXIT_CODES.SUITE_TIMEOUT);
                }, weAreDebugging ? 50000000 : (suman.config.defaultTestSuiteTimeout || 100000));  //100 seconds

                function start() {

                    var count = 0;
                    var num = allTests.length;

                    ee.on('test_complete', function handleCompleteTest() {
                        count++;
                        if (count >= num) {
                            try {
                                clearTimeout(to);
                            } catch (err) {

                            }
                            finally {
                                //TODO: log # of tests passed vs # of tests failed
                                setImmediate(function () {  //we need to wait for all messages sent to
                                    suman.makeExit(); //note: this could just be invoked on('exit'), but we need to force an exit if user puts in timers
                                });
                            }
                        }
                    });


                    function runSuite(suite, cb) {

                        const fn = suite.parallel ? async.each : async.eachSeries;

                        suite.__startSuite(function (err, results) {

                            if (err) {
                                console.error('test error data before log:', suite);
                            }
                            suman.logData(suite);

                            fn(suite.getChildren(), function (child, cb) {

                                child = _.findWhere(allTests, {
                                    testId: child.testId
                                });

                                runSuite(child, cb);

                            }, function (err, results) {
                                cb();
                            });
                        });

                    }

                    runSuite(allTests[0], function complete() {
                        clearInterval(interval);
                    });


                    //async.eachSeries(allTests, function (test, cb) {
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
