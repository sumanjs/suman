'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var Mod = require('module');
var req = Mod.prototype && Mod.prototype.require;
var inBrowser = false;
var _suman = global.__suman = (global.__suman || {});
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
if (_suman.sumanOpts.verbosity > 8) {
    console.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
}
var count = 0;
Mod.prototype && (Mod.prototype.require = function () {
    var args = Array.from(arguments);
    var lastArg = args[args.length - 1];
    var ret = req.apply(this, arguments);
    return ret;
});
var oncePostFn;
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var fatalRequestReply = require('./helpers/fatal-request-reply');
var async = require('async');
var constants = require('../config/suman-constants');
var weAreDebugging = require('../lib/helpers/we-are-debugging');
if (process.env.SUMAN_DEBUG === 'yes') {
    console.log(' => Suman require.main => ', require.main.filename);
    console.log(' => Suman parent module => ', module.parent.filename);
}
process.on('warning', function (w) {
    if (weAreDebugging) {
        console.error(w.stack || w);
    }
    else if (!(/deprecated/i.test(String(w)))) {
        console.error(w.stack || w);
    }
});
process.on('uncaughtException', function (err) {
    if (typeof err !== 'object') {
        console.log(colors.bgMagenta.black(' => Error is not an object => ', util.inspect(err)));
        err = { stack: typeof err === 'string' ? err : util.inspect(err) };
    }
    if (err._alreadyHandledBySuman) {
        console.error(' => Error already handled => \n', (err.stack || err));
    }
    else {
        sumanRuntimeErrors.push(err);
        var msg_1 = err.stack || err;
        err._alreadyHandledBySuman = true;
        console.error('\n\n', colors.magenta(' => Suman uncaught exception => \n' + msg_1));
        if (String(msg_1).match(/suite is not a function/i)) {
            process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
                '\n\tsee sumanjs.github.io\n\n');
        }
        else if (String(msg_1).match(/describe is not a function/i)) {
            process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
                '\n\tsee sumanjs.github.io\n\n');
        }
        if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
            _suman.sumanUncaughtExceptionTriggered = true;
            console.error('\n\n', ' => Given uncaught exception,' +
                ' Suman will now run suman.once.post.js shutdown hooks...');
            console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
                'the "--ignore-uncaught-exceptions" option.)');
            async.parallel([
                function (cb) {
                    if (!oncePostFn) {
                        console.error(' => Suman internal warning, oncePostFn not yet defined.');
                        return process.nextTick(cb);
                    }
                    oncePostFn(cb);
                },
                function (cb) {
                    fatalRequestReply({
                        type: constants.runner_message_type.FATAL,
                        data: {
                            error: msg_1,
                            msg: msg_1
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
        }
    }
});
process.on('unhandledRejection', function (reason, p) {
    reason = (reason.stack || reason);
    console.error('Unhandled Rejection at: Promise ', p, '\n\n=> Rejection reason => ', reason, '\n\n=> stack =>', reason);
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
var stack = require('callsite');
var colors = require('colors/safe');
var pragmatik = require('pragmatik');
var debug = require('suman-debug')('s:index');
require('./patches/all');
var rules = require('./helpers/handle-varargs');
var makeSuman = require('./suman');
var su = require('suman-utils');
var acquireDeps = require('./acquire-deps');
var acquireIntegrantsSingleProcess = require('./acquire-integrants-single-proc');
var es = require('./exec-suite');
var fnArgs = require('function-arguments');
var makeIocDepInjections = require('./injection/ioc-injector');
var integPreConfiguration = null;
var allOncePreKeys = _suman.oncePreKeys = [];
var allOncePostKeys = _suman.oncePostKeys = [];
var integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
var integProgressEmitter = _suman.integProgressEmitter = (_suman.integProgressEmitter || new EE());
var integContainer = _suman.integContainer = (_suman.integContainer || {});
var integProgressContainer = _suman.integProgressContainer = (_suman.integProgressContainer || {});
var iocEmitter = _suman.iocEmitter = (_suman.iocEmitter || new EE());
var iocContainer = _suman.iocContainer = (_suman.iocContainer || {});
var iocProgressContainer = _suman.iocProgressContainer = (_suman.iocProgressContainer || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var pkgDotJSON = require('../package.json');
var gv;
if (gv = process.env.SUMAN_GLOBAL_VERSION) {
    var lv = String(pkgDotJSON.version);
    debug(' => Global version => ', gv);
    debug(' => Local version => ', lv);
    if (gv !== lv) {
        console.error('\n\n', colors.red(' => Suman warning => You local version of Suman differs from the cli version of Suman.'));
        console.error(colors.cyan(' => Global version => '), gv);
        console.error(colors.cyan(' => Local version => '), lv, '\n\n');
    }
}
var counts = require('./helpers/suman-counts');
var cwd = process.cwd();
var projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(cwd) || '/';
require('./helpers/handle-suman-counts');
oncePostFn = require('./helpers/handle-suman-once-post');
var singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var isViaSumanWatch = process.env.SUMAN_WATCH === 'yes';
var main = require.main.filename;
var usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');
var sumanConfig = require('./helpers/load-suman-config')(null);
if (!_suman.usingRunner && !_suman.viaSuman) {
    require('./helpers/print-version-info');
}
if (sumanOpts.verbose && !usingRunner && !_suman.viaSuman) {
    console.log(' => Suman verbose message => Project root:', projectRoot);
}
var sumanPaths = require('./helpers/resolve-shared-dirs')(sumanConfig, projectRoot, sumanOpts);
var sumanObj = require('./helpers/load-shared-objects')(sumanPaths, projectRoot, sumanOpts);
var integrantPreFn = sumanObj.integrantPreFn;
var iocFn = sumanObj.iocFn;
var testDebugLogPath = sumanPaths.testDebugLogPath;
var testLogPath = sumanPaths.testLogPath;
fs.writeFileSync(testDebugLogPath, '\n', { flag: 'w' });
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), { flag: 'w' });
if (sumanReporters.length < 1) {
    var fn = void 0;
    if (_suman.sumanOpts.useTAPOutput) {
        if (_suman.sumanOpts.verbosity > 7) {
            console.log(' => Using TAP reporter.');
        }
        fn = require('./reporters/tap-reporter');
    }
    else {
        fn = require('./reporters/std-reporter');
    }
    assert(typeof fn === 'function', 'Native reporter fail.');
    _suman.sumanReporters.push(fn);
    fn.call(null, resultBroadcaster);
}
var loaded = false;
var moduleCount = 0;
var init = function ($module, $opts, confOverride) {
    debugger;
    if (init.$ingletonian) {
        if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
            console.error(colors.red(' => Suman usage warning => suman.init() only needs to be called once per test file.'));
            return init.$ingletonian;
        }
    }
    require('./handle-exit');
    if (this instanceof init) {
        console.error('\n', ' => Suman usage warning: no need to use "new" keyword with the suman.init()' +
            ' function as it is not a standard constructor');
        return init.apply(null, arguments);
    }
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as first arg to suman.init()');
    }
    debugger;
    if (confOverride) {
        assert(confOverride && (typeof confOverride === 'object'), ' => Suman conf override value must be defined and an object.');
        assert(!Array.isArray(confOverride), ' => Suman conf override value must be an object, but not an array.');
        Object.assign(_suman.sumanConfig, confOverride);
    }
    _suman.sumanInitCalled = true;
    _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
    _suman._currentModule = $module.filename;
    _suman.SUMAN_TEST = 'yes';
    debug(' => Suman debug message => require.main.filename => ', '"' + require.main.filename + '"');
    debug(' => Suman debug message => suman index was required from module (module.parent) => ', module.parent.filename);
    if (module.parent && module.parent.parent) {
        debug(' => Suman debug message => (module.parent.parent) => ', module.parent.parent.filename);
    }
    if (module.parent && module.parent.parent && module.parent.parent.parent) {
        debug(' => Suman debug message => (module.parent.parent.parent) => ', module.parent.parent.parent.filename);
    }
    if (!loaded) {
    }
    if ($opts) {
        assert(typeof $opts === 'object' && !Array.isArray($opts), 'Please pass an options object as a second argument to suman.init()');
    }
    var matches = false;
    if (usingRunner) {
        if (process.env.SUMAN_CHILD_TEST_PATH === $module.filename) {
            matches = true;
        }
    }
    else {
        if (_suman.sumanOpts.vverbose) {
            console.log(' => Suman vverbose message => require.main.filename value:', main);
        }
        if (main === $module.filename) {
            matches = true;
        }
    }
    var opts = $opts || {};
    var series = !!opts.series;
    var writable = opts.writable;
    if ($module._sumanInitted) {
        console.error(' => Suman warning => suman.init() already called for this module with filename => ', $module.filename);
        return;
    }
    $module._sumanInitted = true;
    moduleCount++;
    var testSuiteQueue = $module.testSuiteQueue = [];
    suiteResultEmitter.on('suman-completed', function () {
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
    var exportEvents = $module.exports = (writable || Transform());
    exportEvents.counts = {
        sumanCount: 0
    };
    Object.defineProperty($module, 'exports', {
        writable: false
    });
    var integrants = opts.integrants || opts.pre || [];
    assert(Array.isArray(integrants), '"integrants" must be an array type.');
    integrants = integrants.filter(function (i) { return i; });
    if (opts.__expectedExitCode !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
        var expectedExitCode = _suman.expectedExitCode = _suman.expectedExitCode || opts.__expectedExitCode;
        assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
            'code not an acceptable integer.');
    }
    if (opts.timeout !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
        var timeout = _suman.expectedTimeout = opts.timeout;
        assert(Number.isInteger(timeout) && timeout > 0, ' => Suman usage error => Expected timeout value ' +
            'is not an acceptable integer.');
        setTimeout(function () {
            console.log('\n', new Error('=> Suman test file has timed out -' +
                ' "timeout" value passed to suman.init() has been reached exiting....').stack);
            process.exit(constants.EXIT_CODES.TEST_FILE_TIMEOUT);
        }, timeout);
    }
    var $oncePost = opts.post || [];
    assert(Array.isArray($oncePost), '"post" option must be an array type.');
    var waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
    var waitForIntegrantResponses = integrants.length > 0;
    allOncePostKeys.push($oncePost);
    allOncePreKeys.push(integrants);
    var _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var filenames = [
        $module.filename,
        require.resolve('./runner-helpers/run-child.js'),
        require.resolve('../cli.js')
    ];
    var exportTests = (opts.export === true || singleProc || _suman._sumanIndirect);
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
        if (process.env.SUMAN_DEBUG === 'yes' || _suman.sumanOpts.vverbose) {
            console.log(colors.magenta(' => Suman message => export option set to true.'));
        }
    }
    if (usingRunner) {
        _suman._writeTestError = function (data, options) {
            assert(typeof data === 'string', ' => Implementation error => data passed to ' +
                '_writeTestError should already be in string format => \n' + util.inspect(data));
            options = options || {};
            assert(typeof options === 'object', ' => Options should be an object.');
            if (true || process.env.SUMAN_DEBUG === 'yes') {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
        _suman._writeLog = function (data) {
            if (process.env.SUMAN_DEBUG === 'yes') {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
    }
    else {
        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
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
            fs.appendFileSync(testDebugLogPath, '\n' + data + '\n');
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
    if (waitForIntegrantResponses || process.env.SUMAN_SINGLE_PROCESS === 'yes') {
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
            integPreConfiguration =
                (integPreConfiguration || integrantPreFn({ temp: 'we are in suman project => lib/index.js' }));
            var d = domain.create();
            d.once('error', function (err) {
                err = new Error(' => Suman fatal error => there was a problem verifying the ' +
                    'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));
                fatalRequestReply({
                    type: constants.runner_message_type.FATAL,
                    data: {
                        msg: err,
                        stack: err
                    }
                }, function () {
                    console.error(err.stack || err);
                    _suman._writeTestError(err.stack || err);
                    process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
                });
            });
            d.run(function () {
                if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
                    acquireIntegrantsSingleProcess(integrants, integPreConfiguration, su.onceAsync(null, function (err, vals) {
                        d.exit();
                        process.nextTick(function () {
                            if (err) {
                                emitter.emit('error', err);
                            }
                            else {
                                emitter.emit('vals', vals);
                            }
                        });
                    }));
                }
                else {
                    acquireDeps(integrants, integPreConfiguration, su.onceAsync(null, function (err, vals) {
                        d.exit();
                        process.nextTick(function () {
                            if (err) {
                                integrantsEmitter.emit('error', err);
                            }
                            else {
                                integrantsEmitter.emit('vals', vals);
                            }
                        });
                    }));
                }
            });
        };
    }
    var integrantsInvoked = false;
    init.tooLate = false;
    var start = function (desc, opts, arr, cb) {
        var args = pragmatik.parse(arguments, rules.createSignature);
        if (init.tooLate === true && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
            console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
                'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
            return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
        }
        var sumanEvents = Transform();
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
            init.tooLate = true;
        });
        exportEvents.counts.sumanCount++;
        counts.sumanCount++;
        debug(' in index => exportEvents count =>', exportEvents.counts.sumanCount, ' => counts.sumanCount => ', counts.sumanCount);
        var to = setTimeout(function () {
            console.error(' => Suman usage error => Integrant acquisition timeout.');
            process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
        }, _suman.weAreDebugging ? 50000000 : 50000);
        function onPreVals(vals) {
            clearTimeout(to);
            if (!inBrowser && !_suman.iocConfiguration || process.env.SUMAN_SINGLE_PROCESS === 'yes') {
                iocData['suman.once.pre.js'] = vals;
                _suman.userData = JSON.parse(JSON.stringify(iocData));
                var iocFnArgs = fnArgs(iocFn);
                var getiocFnDeps = makeIocDepInjections(iocData);
                var iocFnDeps = getiocFnDeps(iocFnArgs);
                _suman.iocConfiguration = iocFn.apply(null, iocFnDeps) || {};
            }
            else {
                _suman.iocConfiguration = _suman.iocConfiguration || {};
            }
            makeSuman($module, _interface, true, sumanConfig, function (err, suman) {
                if (err) {
                    _suman._writeTestError(err.stack || err);
                    return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
                }
                if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
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
                    var run_1 = es.main(suman);
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
                                    console.log('ARGUMENTS => ', arguments);
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
        if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
            integrantsEmitter.once('error', function (err) {
                clearTimeout(to);
                console.error(err.stack || err);
                _suman._writeTestError(err.stack || err);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
            });
            integrantsEmitter.once('vals', onPreVals);
        }
        else {
            sumanEvents.once('vals', onPreVals);
        }
        process.nextTick(function () {
            if (!integrantsInvoked || (process.env.SUMAN_SINGLE_PROCESS === 'yes')) {
                integrantsInvoked = true;
                var emitter = (process.env.SUMAN_SINGLE_PROCESS === 'yes' ? sumanEvents : null);
                debug('calling integrants fn');
                integrantsFn(emitter);
            }
            else {
                debug('integrantsInvoked more than once for non-SUMAN_SINGLE_PROCESS mode run', 'process.env.SUMAN_SINGLE_PROCESS => ' + process.env.SUMAN_SINGLE_PROCESS);
            }
        });
    };
    init.$ingletonian = {
        parent: $module.parent,
        file: _suman.sumanTestFile = $module.filename
    };
    start.skip = init.$ingletonian.skip = function () {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].skip = true;
        start.apply(this, args);
    };
    start.only = init.$ingletonian.only = function () {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        _suman.describeOnlyIsTriggered = true;
        args[1].only = true;
        start.apply(this, args);
    };
    start.delay = init.$ingletonian.delay = function () {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].delay = true;
        start.apply(this, args);
    };
    var create = init.$ingletonian.create = start;
    _interface === 'TDD' ? init.$ingletonian.suite = create : init.$ingletonian.describe = create;
    loaded = true;
    return init.$ingletonian;
};
function Writable(type) {
    if (this instanceof Writable) {
        return Writable.apply(global, arguments);
    }
    var strm = new stream.Writable({
        write: function (chunk, encoding, cb) {
            console.log('index chunks:', String(chunk));
        }
    });
    strm.cork();
    return strm;
}
function Transform() {
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
function autoPass() {
    console.log(' => Suman auto pass function passthrough recorded, this is a no-op.');
}
function autoFail() {
    throw new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
}
function once(fn) {
    var cache = null;
    return function (cb) {
        if (cache) {
            process.nextTick(function () {
                cb.call(null, null, cache);
            });
        }
        else {
            fn.call(null, function (err, val) {
                if (!err) {
                    cache = val || {
                        'Suman says': 'This is a dummy-cache val. ' +
                            'See => sumanjs.github.io/tricks-and-tips.html'
                    };
                }
                cb.apply(null, arguments);
            });
        }
    };
}
function load(opts) {
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
}
var suman = {
    load: load,
    autoPass: autoPass,
    autoFail: autoFail,
    init: init,
    constants: constants,
    Writable: Writable,
    Transform: Transform,
    once: once
};
try {
    window.suman = suman;
    console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}
module.exports = suman;
