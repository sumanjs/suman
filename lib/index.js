'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var inBrowser = false;
var _suman = global.__suman = (global.__suman || {});
require('./helpers/add-suman-global-properties');
var sumanOptsFromRunner = _suman.sumanOpts || (process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {});
var sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || sumanOptsFromRunner);
try {
    window.module = { filename: '/' };
    module.parent = module;
    inBrowser = _suman.inBrowser = true;
}
catch (err) {
    inBrowser = _suman.inBrowser = false;
}
if (_suman.sumanOpts) {
    if (_suman.sumanOpts.verbosity > 8) {
        console.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
    }
}
else {
    _suman.logWarning('sumanOpts is not yet defined in runtime.');
}
var oncePostFn;
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var async = require('async');
var weAreDebugging = require('../lib/helpers/we-are-debugging');
var constants = require('../config/suman-constants').constants;
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
if (IS_SUMAN_DEBUG) {
    console.log(' => Suman require.main => ', require.main.filename);
    console.log(' => Suman parent module => ', module.parent.filename);
}
var sigintCount = 0;
process.on('SIGINT', function () {
    sigintCount++;
    console.log('\n');
    _suman.logError(colors.red('SIGINT signal caught by suman process.'));
    console.log('\n');
    if (sigintCount === 2) {
        process.exit(1);
    }
    else if (sigintCount === 1) {
        shutdownSuman('SIGINT');
    }
});
var sigtermCount = 0;
process.on('SIGTERM', function () {
    sigtermCount++;
    console.log('\n');
    _suman.logError(colors.red('SIGTERM signal caught by suman process.'));
    console.log('\n');
    if (sigtermCount === 2) {
        process.exit(1);
    }
    else if (sigtermCount === 1) {
        shutdownSuman('SIGINT');
    }
});
var shutdownSuman = function (msg) {
    async.parallel([
        function (cb) {
            async.series([
                function (cb) {
                    if (runAfterAlways && _suman.whichSuman) {
                        runAfterAlways(_suman.whichSuman, cb);
                    }
                    else {
                        process.nextTick(cb);
                    }
                },
                function (cb) {
                    if (oncePostFn) {
                        oncePostFn(cb);
                    }
                    else {
                        console.error(' => Suman internal warning, oncePostFn not yet defined.');
                        process.nextTick(cb);
                    }
                },
            ], cb);
        },
        function (cb) {
            fatalRequestReply({
                type: constants.runner_message_type.FATAL,
                data: {
                    error: msg,
                    msg: msg
                }
            }, cb);
        }
    ], function (err, resultz) {
        var results = resultz[0];
        if (err) {
            console.error(err.stack || err);
        }
        if (Array.isArray(results)) {
            results.filter(function (r) { return r; }).forEach(function (r) {
                console.error(r.stack || r);
            });
            process.nextTick(function () {
                process.exit(88);
            });
        }
        else {
            process.nextTick(function () {
                process.exit(89);
            });
        }
    });
};
process.on('warning', function (w) {
    if (weAreDebugging) {
        console.error(w.stack || w);
    }
    else if (!(/deprecated/i.test(String(w)))) {
        console.error(w.stack || w);
    }
});
process.on('uncaughtException', function (err) {
    if (!err || typeof err !== 'object') {
        console.log(colors.bgMagenta.black(' => Error is not an object => ', util.inspect(err)));
        err = { stack: typeof err === 'string' ? err : util.inspect(err) };
    }
    if (err._alreadyHandledBySuman) {
        console.error(' => Error already handled => \n', (err.stack || err));
        return;
    }
    else {
        err._alreadyHandledBySuman = true;
    }
    sumanRuntimeErrors.push(err);
    if (_suman.afterAlwaysEngaged) {
        return;
    }
    setTimeout(function () {
        var msg = err.stack || err;
        if (typeof msg !== 'string') {
            msg = util.inspect(msg);
        }
        console.error('\n\n', colors.magenta(' => Suman uncaught exception => \n' + msg));
        if (String(msg).match(/suite is not a function/i)) {
            process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
                '\n\tsee sumanjs.org\n\n');
        }
        else if (String(msg).match(/describe is not a function/i)) {
            process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
                '\n\tsee sumanjs.org\n\n');
        }
        if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
            _suman.sumanUncaughtExceptionTriggered = true;
            console.error('\n\n', ' => Given uncaught exception,' +
                ' Suman will now run suman.once.post.js shutdown hooks...');
            console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
                'the "--ignore-uncaught-exceptions" option.)');
            shutdownSuman(String(msg));
        }
    }, 400);
});
process.on('unhandledRejection', function (reason, p) {
    reason = (reason.stack || reason);
    console.error('\n\nUnhandled Rejection at: Promise ', p, '\n\n=> Rejection reason => ', reason, '\n\n=> stack =>', reason);
    if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
        _suman.sumanUncaughtExceptionTriggered = true;
        fatalRequestReply({
            type: constants.runner_message_type.FATAL,
            data: {
                error: reason,
                msg: reason
            }
        }, function () {
            process.exit(53);
        });
    }
});
var domain = require('domain');
var os = require('os');
var assert = require('assert');
var path = require('path');
var cp = require('child_process');
var EE = require('events');
var stream = require('stream');
var fs = require('fs');
var colors = require('colors/safe');
var pragmatik = require('pragmatik');
var debug = require('suman-debug')('s:index');
require('./patches/all');
var runAfterAlways = require('./helpers/run-after-always').runAfterAlways;
var integrantInjector = require('./injection/integrant-injector');
var rules = require('./helpers/handle-varargs');
var suman_1 = require("./suman");
var su = require('suman-utils');
var acquireDeps = require('./acquire-deps');
var execSuite = require('./exec-suite').execSuite;
var fnArgs = require('function-arguments');
var makeIocDepInjections = require('./injection/ioc-injector');
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var integPreConfiguration = null;
var allOncePreKeys = _suman.oncePreKeys = [];
var allOncePostKeys = _suman.oncePostKeys = [];
var integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var pkgDotJSON = require('../package.json');
var gv;
if (gv = process.env.SUMAN_GLOBAL_VERSION) {
    var lv = String(pkgDotJSON.version);
    debug(' => Global version => ', gv);
    debug(' => Local version => ', lv);
    if (gv !== lv) {
        console.error('\n');
        _suman.logError(colors.red('warning => You local version of Suman differs from the cli version of Suman.'));
        _suman.logError(colors.cyan('Global version => '), gv);
        _suman.logError(colors.cyan('Local version => '), lv);
        console.error('\n');
    }
}
var counts = require('./helpers/suman-counts');
var cwd = process.cwd();
var projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(cwd) || '/';
require('./helpers/handle-suman-counts');
oncePostFn = require('./helpers/handle-suman-once-post');
var main = require.main.filename;
var usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');
var sumanConfig = require('./helpers/load-suman-config')(null);
if (!_suman.usingRunner && !_suman.viaSuman) {
    require('./helpers/print-version-info');
}
var sumanPaths = require('./helpers/resolve-shared-dirs')(sumanConfig, projectRoot, sumanOpts);
var sumanObj = require('./helpers/load-shared-objects')(sumanPaths, projectRoot, sumanOpts);
var integrantPreFn = sumanObj.integrantPreFn, iocFn = sumanObj.iocFn;
var testDebugLogPath = sumanPaths.testDebugLogPath;
var testLogPath = sumanPaths.testLogPath;
fs.writeFileSync(testDebugLogPath, '\n', { flag: 'w' });
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), { flag: 'w' });
var loaded = false;
var moduleCount = 0;
exports.init = function ($module, $opts, confOverride) {
    debugger;
    if (exports.init.$ingletonian) {
        if (!SUMAN_SINGLE_PROCESS) {
            console.error(colors.red(' => Suman usage warning => suman.init() only needs to be called once per test file.'));
            return exports.init.$ingletonian;
        }
    }
    if (this instanceof exports.init) {
        console.error('\n', ' => Suman usage warning: no need to use "new" keyword with the suman.init()' +
            ' function as it is not a standard constructor');
        return exports.init.apply(null, arguments);
    }
    require('./handle-exit');
    require('./helpers/load-reporters-last-ditch');
    var sumanOpts = _suman.sumanOpts;
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as first arg to suman.init()');
    }
    debugger;
    if (confOverride) {
        assert(su.isObject(confOverride), ' => Suman conf override value must be defined and an object => {}.');
        Object.assign(_suman.sumanConfig, confOverride);
    }
    _suman.sumanInitCalled = true;
    _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
    _suman._currentModule = $module.filename;
    _suman.SUMAN_TEST = 'yes';
    if (!loaded) {
    }
    if ($opts) {
        assert(su.isObject($opts), 'Please pass an options object as a second argument to suman.init()');
    }
    var matches = false;
    if (usingRunner) {
        if (process.env.SUMAN_CHILD_TEST_PATH === $module.filename) {
            matches = true;
        }
    }
    else {
        if (sumanOpts.verbosity > 7) {
            console.log(' => Suman verbose message => require.main.filename value:', main);
        }
        if (main === $module.filename) {
            matches = true;
        }
    }
    var opts = $opts || {};
    var series = !!opts.series;
    var writable = opts.writable;
    if ($module._sumanInitted) {
        console.error(' => Suman warning => suman.init() already called for ' +
            'this module with filename => ', $module.filename);
        return;
    }
    $module._sumanInitted = true;
    moduleCount++;
    var testSuiteQueue = $module.testSuiteQueue = [];
    suiteResultEmitter.on('suman-completed', function () {
        _suman.whichSuman = null;
        testSuiteQueue.pop();
        var fn;
        if (fn = testSuiteQueue[testSuiteQueue.length - 1]) {
            debug(' => Running testSuiteQueue fn => ', String(fn));
            fn.call(null);
        }
        else {
            debug(' => Suman testSuiteQueue is empty.');
        }
    });
    var exportEvents = $module.exports = (writable || SumanTransform());
    exportEvents.counts = {
        sumanCount: 0
    };
    Object.defineProperty($module, 'exports', {
        writable: false
    });
    var integrants;
    try {
        integrants = (opts.integrants || opts.pre || []).filter(function (item) {
            assert(typeof item === 'string', "once.pre item must be a string. Instead we have => " + util.inspect(item));
            return item;
        });
    }
    catch (err) {
        _suman.logError('"integrants/pre" option must be an array type.');
        throw err;
    }
    integrants = integrants.filter(function (i) { return i; });
    if (opts.__expectedExitCode !== undefined && !SUMAN_SINGLE_PROCESS) {
        var expectedExitCode = _suman.expectedExitCode = _suman.expectedExitCode || opts.__expectedExitCode;
        assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
            'code not an positive/acceptable integer.');
    }
    if (opts.timeout !== undefined && !SUMAN_SINGLE_PROCESS) {
        var timeout = _suman.expectedTimeout = opts.timeout;
        assert(Number.isInteger(timeout) && timeout > 0, ' => Suman usage error => Expected timeout value ' +
            'is not an acceptable integer.');
        setTimeout(function () {
            console.log('\n', new Error('=> Suman test file has timed out -' +
                ' "timeout" value passed to suman.init() has been reached exiting....').stack);
            process.exit(constants.EXIT_CODES.TEST_FILE_TIMEOUT);
        }, timeout);
    }
    var $oncePost;
    try {
        $oncePost = (opts.post || []).filter(function (item) {
            assert(typeof item === 'string', "once.post key must be a string. Instead we have => " + util.inspect(item));
            return item;
        });
    }
    catch (err) {
        _suman.logError('"post" option must be an array type.');
        throw err;
    }
    var waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
    var waitForIntegrantResponses = integrants.length > 0;
    allOncePostKeys.push($oncePost);
    allOncePreKeys.push(integrants);
    var _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var exportTests = (opts.export === true || SUMAN_SINGLE_PROCESS || _suman._sumanIndirect);
    var iocData = opts.iocData || opts.ioc || {};
    if (iocData) {
        try {
            assert(typeof iocData === 'object' && !Array.isArray(iocData), colors.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
                'to point to an object'));
        }
        catch (err) {
            console.log(err.stack);
            process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
        }
    }
    if (exportTests) {
        if (su.isSumanDebug() || sumanOpts.verbosity > 7) {
            console.log(colors.magenta(' => Suman message => export option set to true.'));
        }
    }
    if (usingRunner) {
        _suman._writeTestError = function (data, options) {
            assert(typeof data === 'string', ' => Implementation error => data passed to ' +
                '_writeTestError should already be in string format => \n' + util.inspect(data));
            options = options || {};
            assert(typeof options === 'object', ' => Options should be an object.');
            if (true || IS_SUMAN_DEBUG) {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
        _suman._writeLog = function (data) {
            if (IS_SUMAN_DEBUG) {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
    }
    else {
        if (SUMAN_SINGLE_PROCESS) {
            fs.writeFileSync(testLogPath, '\n => [SUMAN_SINGLE_PROCESS mode] Next Suman run @' + new Date() +
                '\n Test file => "' + $module.filename + '"', { flag: 'a' });
        }
        else {
            fs.writeFileSync(testLogPath, '\n\n => Test file => "' + $module.filename + '"\n\n', { flag: 'a' });
        }
        _suman._writeLog = function (data) {
            fs.appendFileSync(testLogPath, data);
        };
        _suman._writeTestError = function (data, ignore) {
            if (!ignore) {
                _suman.checkTestErrorLog = true;
            }
            if (data) {
                if (typeof data !== 'string') {
                    data = util.inspect(data);
                }
                fs.appendFileSync(testDebugLogPath, '\n' + data + '\n');
            }
            else {
                _suman.logError('Suman implementation error => no data passed to _writeTestError. Please report.');
            }
        };
        fs.writeFileSync(testDebugLogPath, '\n\n', { flags: 'a', encoding: 'utf8' });
        _suman._writeTestError('\n\n', true);
        _suman._writeTestError(' ### Suman start run @' + new Date(), true);
        _suman._writeTestError(' ### Filename => ' + $module.filename, true);
        _suman._writeTestError(' ### Command => ' + JSON.stringify(process.argv), true);
    }
    var integrantsFn = null;
    var integrantsReady = null;
    var postOnlyReady = null;
    if (waitForIntegrantResponses || SUMAN_SINGLE_PROCESS) {
        integrantsReady = false;
    }
    if (waitForResponseFromRunnerRegardingPostList) {
        postOnlyReady = false;
    }
    if (integrants.length < 1) {
        integrantsFn = function (emitter) {
            process.nextTick(function () {
                if (emitter) {
                    emitter.emit('vals', {});
                }
                else {
                    integrantsEmitter.emit('vals', {});
                }
            });
        };
    }
    else if (_suman.usingRunner) {
        integrantsFn = function () {
            var integrantsFromParentProcess = [];
            var oncePreVals = {};
            if (integrantsReady) {
                process.nextTick(function () {
                    integrantsEmitter.emit('vals', oncePreVals);
                });
            }
            else {
                var integrantMessage_1 = function (msg) {
                    if (msg.info === 'integrant-ready') {
                        integrantsFromParentProcess.push(msg.data);
                        oncePreVals[msg.data] = msg.val;
                        if (su.checkForEquality(integrants, integrantsFromParentProcess)) {
                            integrantsReady = true;
                            if (postOnlyReady !== false) {
                                process.removeListener('message', integrantMessage_1);
                                integrantsEmitter.emit('vals', oncePreVals);
                            }
                        }
                    }
                    else if (msg.info === 'integrant-error') {
                        process.removeListener('message', integrantMessage_1);
                        integrantsEmitter.emit('error', msg);
                    }
                    else if (msg.info === 'once-post-received') {
                        postOnlyReady = true;
                        if (integrantsReady !== false) {
                            process.removeListener('message', integrantMessage_1);
                            integrantsEmitter.emit('vals', oncePreVals);
                        }
                    }
                };
                process.on('message', integrantMessage_1);
                process.send({
                    type: constants.runner_message_type.INTEGRANT_INFO,
                    msg: integrants,
                    oncePost: $oncePost,
                    expectedExitCode: _suman.expectedExitCode,
                    expectedTimeout: _suman.expectedTimeout
                });
            }
        };
    }
    else {
        integrantsFn = function (emitter) {
            if (!integPreConfiguration) {
                var args = fnArgs(integrantPreFn);
                var ret = integrantPreFn.apply(null, integrantInjector(args));
                if (ret && su.isObject(ret.dependencies)) {
                    integPreConfiguration = ret.dependencies;
                }
                else {
                    throw new Error(' => <suman.once.pre.js> file does not export an object with a property called "dependencies".');
                }
            }
            var d = domain.create();
            d.once('error', function (err) {
                console.error(colors.magenta(' => Your test was looking to source the following integrant dependencies:\n', colors.cyan(util.inspect(integrants)), '\n', 'But there was a problem.'));
                err = new Error(' => Suman fatal error => there was a problem verifying the ' +
                    'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));
                console.error(err.stack || err);
                fatalRequestReply({
                    type: constants.runner_message_type.FATAL,
                    data: {
                        msg: err,
                        stack: err
                    }
                }, function () {
                    _suman._writeTestError(err.stack || err);
                    process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
                });
            });
            d.run(function () {
                acquireDeps(integrants, integPreConfiguration).then(function (vals) {
                    d.exit();
                    process.nextTick(function () {
                        integrantsEmitter.emit('vals', vals);
                    });
                }, function (err) {
                    d.exit();
                    process.nextTick(function () {
                        integrantsEmitter.emit('error', err);
                    });
                });
            });
        };
    }
    var integrantsInvoked = false;
    exports.init.tooLate = false;
    var start = function (desc, opts, arr, cb) {
        var args = pragmatik.parse(arguments, rules.createSignature);
        args[1].__preParsed = true;
        if (exports.init.tooLate === true && !SUMAN_SINGLE_PROCESS) {
            console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
                'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
            return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
        }
        var sumanEvents = SumanTransform();
        sumanEvents.on('test', function () {
            debug('SUMAN EVENTS test!');
            exportEvents.emit.bind(exportEvents, 'test').apply(exportEvents, arguments);
        });
        sumanEvents.on('error', function () {
            debug('SUMAN EVENTS error!');
            exportEvents.emit.bind(exportEvents, 'error').apply(exportEvents, arguments);
        });
        sumanEvents.on('suman-test-file-complete', function () {
            debug('SUMAN EVENTS suman-test-file-complete!');
            exportEvents.emit.bind(exportEvents, 'suman-test-file-complete').apply(exportEvents, arguments);
        });
        process.nextTick(function () {
            exports.init.tooLate = true;
        });
        exportEvents.counts.sumanCount++;
        counts.sumanCount++;
        debug(' in index => exportEvents count =>', exportEvents.counts.sumanCount, ' => counts.sumanCount => ', counts.sumanCount);
        var to = setTimeout(function () {
            console.error(' => Suman usage error => Integrant acquisition timeout.');
            process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
        }, _suman.weAreDebugging ? 50000000 : 500000);
        function onPreVals(vals) {
            clearTimeout(to);
            _suman['$pre'] = JSON.parse(JSON.stringify(vals));
            if (!inBrowser && !_suman.iocConfiguration || SUMAN_SINGLE_PROCESS) {
                _suman.userData = JSON.parse(JSON.stringify(iocData));
                var iocFnArgs = fnArgs(iocFn);
                var getiocFnDeps = makeIocDepInjections(iocData);
                var iocFnDeps = getiocFnDeps(iocFnArgs);
                var iocRet = iocFn.apply(null, iocFnDeps);
                assert(su.isObject(iocRet.dependencies), ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
                _suman.iocConfiguration = iocRet.dependencies;
            }
            else {
                _suman.iocConfiguration = _suman.iocConfiguration || {};
            }
            assert(su.isObject(_suman.iocConfiguration), ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
            suman_1.default($module, _interface, true, sumanConfig, function (err, suman) {
                if (err) {
                    _suman._writeTestError(err.stack || err);
                    return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
                }
                if (SUMAN_SINGLE_PROCESS) {
                    if (exportEvents.listenerCount('test') < 1) {
                        throw new Error(' => We are in "SUMAN_SINGLE_PROCESS" mode but nobody is listening for test events. ' +
                            'To run SUMAN_SINGLE_PROCESS mode you need to use the suman executable, not plain node.');
                    }
                }
                suman._sumanModulePath = $module.filename;
                if (exportTests && matches) {
                    var $code_1 = constants.EXIT_CODES.EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY;
                    var msg = ' => Suman usage error => You have declared export:true in your suman.init call, ' +
                        'but ran the test directly.';
                    console.error(msg);
                    return fatalRequestReply({
                        type: constants.runner_message_type.FATAL,
                        data: {
                            error: msg,
                            msg: msg
                        }
                    }, function () {
                        _suman._writeTestError(' => Suman usage error => You have declared export:true in ' +
                            'your suman.init call, but ran the test directly.');
                        suman.logFinished(null, function () {
                            process.exit($code_1);
                        });
                    });
                }
                else {
                    suman._sumanEvents = sumanEvents;
                    var run_1 = execSuite(suman);
                    try {
                        process.domain && process.domain.exit();
                    }
                    catch (err) {
                    }
                    global.setImmediate(function () {
                        if (exportTests === true) {
                            if (series) {
                                var fn = function () {
                                    suman.extraArgs = Array.from(arguments);
                                    run_1.apply(null, args);
                                };
                                $module.testSuiteQueue.unshift(fn);
                                sumanEvents.on('suman-test-file-complete', function () {
                                    testSuiteQueue.pop();
                                    var fn;
                                    if (fn = testSuiteQueue[testSuiteQueue.length - 1]) {
                                        sumanEvents.emit('test', fn);
                                    }
                                    else {
                                        console.error(colors.red.bold(' => Suman implementation error => Should not be empty.'));
                                    }
                                });
                                if ($module.testSuiteQueue.length === 1) {
                                    sumanEvents.emit('test', fn);
                                }
                            }
                            else {
                                sumanEvents.emit('test', function () {
                                    suman.extraArgs = Array.from(arguments);
                                    run_1.apply(global, args);
                                });
                            }
                            if (false && writable) {
                                args.push([]);
                                args.push(writable);
                                run_1.apply(global, args);
                            }
                        }
                        else {
                            if (series) {
                                var fn = function () {
                                    run_1.apply(null, args);
                                };
                                $module.testSuiteQueue.unshift(fn);
                                if ($module.testSuiteQueue.length === 1) {
                                    fn.apply(null, args);
                                }
                            }
                            else {
                                run_1.apply(null, args);
                            }
                        }
                    });
                }
            });
        }
        if (SUMAN_SINGLE_PROCESS) {
            sumanEvents.once('vals', onPreVals);
        }
        else {
            integrantsEmitter.once('error', function (err) {
                clearTimeout(to);
                console.error(err.stack || err);
                _suman._writeTestError(err.stack || err);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
            });
            integrantsEmitter.once('vals', onPreVals);
        }
        process.nextTick(function () {
            if (!integrantsInvoked || SUMAN_SINGLE_PROCESS) {
                integrantsInvoked = true;
                var emitter = SUMAN_SINGLE_PROCESS ? sumanEvents : null;
                debug('calling integrants fn');
                integrantsFn(emitter);
            }
            else {
                debug('integrantsInvoked more than once for non-SUMAN_SINGLE_PROCESS mode run', 'process.env.SUMAN_SINGLE_PROCESS => ' + process.env.SUMAN_SINGLE_PROCESS);
            }
        });
    };
    exports.init.$ingletonian = {
        parent: $module.parent,
        file: _suman.sumanTestFile = $module.filename
    };
    start.skip = exports.init.$ingletonian.skip = function () {
        var args = pragmatik.parse(arguments, rules.createSignature);
        args[1].skip = true;
        start.apply(this, args);
    };
    start.only = exports.init.$ingletonian.only = function () {
        var args = pragmatik.parse(arguments, rules.createSignature);
        _suman.describeOnlyIsTriggered = true;
        args[1].only = true;
        start.apply(this, args);
    };
    start.delay = exports.init.$ingletonian.delay = function () {
        var args = pragmatik.parse(arguments, rules.createSignature);
        args[1].delay = true;
        start.apply(this, args);
    };
    var create = exports.init.$ingletonian.create = start;
    _interface === 'TDD' ? exports.init.$ingletonian.suite = create : exports.init.$ingletonian.describe = create;
    loaded = true;
    return exports.init.$ingletonian;
};
function SumanWritable(type) {
    if (this instanceof SumanWritable) {
        return SumanWritable.apply(global, arguments);
    }
    var strm = new stream.Writable({
        write: function (chunk, encoding, cb) {
            console.log('index chunks:', String(chunk));
        }
    });
    strm.cork();
    return strm;
}
exports.SumanWritable = SumanWritable;
function SumanTransform() {
    if (this instanceof SumanTransform) {
        return SumanTransform.apply(global, arguments);
    }
    var BufferStream = function () {
        stream.Transform.apply(this, arguments);
        this.buffer = [];
    };
    util.inherits(BufferStream, stream.Transform);
    BufferStream.prototype._transform = function (chunk, encoding, done) {
        this.push(chunk ? String(chunk) : null);
        this.buffer.push(chunk ? String(chunk) : null);
        done();
    };
    BufferStream.prototype.pipe = function (destination, options) {
        var res = stream.Transform.prototype.pipe.apply(this, arguments);
        this.buffer.forEach(function (b) {
            res.write(String(b));
        });
        return res;
    };
    return new BufferStream();
}
exports.SumanTransform = SumanTransform;
exports.autoPass = function (t) {
    console.log(' => Suman auto pass function passthrough recorded, this is a no-op.');
    if (t.callbackMode) {
        t.done();
    }
};
exports.autoFail = function (t) {
    var err = new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
    if (t.callbackMode) {
        t.done(err);
    }
    else {
        return Promise.reject(err);
    }
};
exports.once = function (fn) {
    var cache = null;
    return function (cb) {
        if (cache) {
            process.nextTick(cb, null, cache);
        }
        else {
            fn.call(null, function (err, val) {
                if (!err) {
                    cache = val || {
                        'Suman says': 'This is a dummy-cache val. ' +
                            'See => sumanjs.org/tricks-and-tips.html'
                    };
                }
                cb.apply(null, arguments);
            });
        }
    };
};
exports.load = function (opts) {
    if (typeof opts !== 'object') {
        throw new Error(' => Suman usage error => Please pass in an options object to the suman.load() function.');
    }
    var pth = opts.path;
    var indirect = !!opts.indirect;
    assert(path.isAbsolute(pth), ' => Suman usage error => Please pass in an absolute path to suman.load() function.');
    _suman._sumanIndirect = indirect;
    var exp = require(pth);
    _suman._sumanIndirect = null;
    return exp;
};
try {
    window.suman = module.exports;
    console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}
var $exports = module.exports;
exports.default = $exports;
