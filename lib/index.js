'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var EE = require("events");
var fs = require("fs");
var chalk = require("chalk");
var su = require("suman-utils");
var async = require("async");
var pragmatik = require('pragmatik');
var inBrowser = false;
var _suman = global.__suman = (global.__suman || {});
_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');
var sumanOptsFromRunner = _suman.sumanOpts || (process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {});
var sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || sumanOptsFromRunner);
if (process.argv.indexOf('-f') > 0) {
    sumanOpts.force = true;
}
else if (process.argv.indexOf('--force') > 0) {
    sumanOpts.force = true;
}
process.on('error', function (e) {
    debugger;
    _suman.logError(su.getCleanErrorString(e));
});
try {
    if (!window.module) {
        window.module = { filename: '/', exports: {} };
        module.parent = module;
    }
    inBrowser = _suman.inBrowser = true;
}
catch (err) {
    inBrowser = _suman.inBrowser = false;
}
if (!_suman.sumanOpts) {
    _suman.logWarning('implementation warning: sumanOpts is not yet defined in runtime.');
}
if (_suman.sumanOpts && _suman.sumanOpts.verbosity > 8) {
    _suman.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
}
require('./index-helpers/exit-handling');
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var constants = require('../config/suman-constants').constants;
var handle_integrants_1 = require("./index-helpers/handle-integrants");
var rules = require('./helpers/handle-varargs');
var suman_1 = require("./suman");
var execSuite = require('./exec-suite').execSuite;
var load_suman_config_1 = require("./helpers/load-suman-config");
var resolve_shared_dirs_1 = require("./helpers/resolve-shared-dirs");
var load_shared_objects_1 = require("./helpers/load-shared-objects");
var acquire_ioc_static_deps_1 = require("./acquire-dependencies/acquire-ioc-static-deps");
var allOncePreKeys = _suman.oncePreKeys = [];
var allOncePostKeys = _suman.oncePostKeys = [];
var suiteResultEmitter = _suman.suiteResultEmitter = _suman.suiteResultEmitter || new EE();
if (!SUMAN_SINGLE_PROCESS) {
    require('./helpers/handle-suman-counts');
}
require('./index-helpers/verify-local-global-version');
var projectRoot, sumanConfig, main, usingRunner, testDebugLogPath, sumanPaths, sumanObj, integrantPreFn;
var loaded = false;
var testSuiteQueueCallbacks = [];
var testRuns = [];
var testSuiteRegistrationQueueCallbacks = [];
var c = (sumanOpts && sumanOpts.series) ? 1 : 3;
var testSuiteQueue = async.queue(function (task, cb) {
    testSuiteQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, c);
var testSuiteRegistrationQueue = async.queue(function (task, cb) {
    testSuiteRegistrationQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, c);
testSuiteRegistrationQueue.drain = function () {
    if (su.vgt(5)) {
        var suites = testRuns.length === 1 ? 'suite' : 'suites';
        _suman.log("Pushing " + testRuns.length + " test " + suites + " onto queue with concurrency " + c + ".\n\n");
    }
    while (testRuns.length > 0) {
        testSuiteQueue.push(testRuns.shift());
    }
};
testSuiteQueue.drain = function () {
    suiteResultEmitter.emit('suman-test-file-complete');
};
suiteResultEmitter.on('suman-test-registered', function (fn) {
    testRuns.push(fn);
    process.nextTick(function () {
        var fn = testSuiteRegistrationQueueCallbacks.pop();
        fn && fn.call(null);
    });
});
suiteResultEmitter.on('suman-completed', function () {
    process.nextTick(function () {
        var fn = testSuiteQueueCallbacks.pop();
        fn && fn.call(null);
    });
});
_suman.writeTestError = function (data, ignore) {
    if (IS_SUMAN_DEBUG && !_suman.usingRunner) {
        if (!ignore)
            _suman.checkTestErrorLog = true;
        if (!data)
            data = new Error('falsy data passed to writeTestError').stack;
        if (typeof data !== 'string')
            data = util.inspect(data);
        fs.appendFileSync(testDebugLogPath, data);
    }
};
var initMap = new Map();
exports.init = function ($module, $opts, confOverride) {
    debugger;
    if (this instanceof exports.init) {
        throw new Error('no need to use "new" keyword with the suman.init() function as it is not a constructor');
    }
    if (initMap.size > 0 && !SUMAN_SINGLE_PROCESS) {
        _suman.logError(chalk.red('Suman usage warning => suman.init() only needs to be called once per test script.'));
    }
    if (!$module) {
        throw new Error('please pass a module instance to suman.init(), e.g., suman.init(module).');
    }
    if (initMap.get($module)) {
        return initMap.get($module);
    }
    if (!$module.filename) {
        _suman.logWarning("warning: module instance did not have a 'filename' property.");
        $module.filename = '/';
    }
    if (!$module.exports) {
        _suman.logWarning("warning: module instance did not have an 'exports' property.");
        $module.exports = {};
    }
    if (!projectRoot) {
        projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
        main = require.main.filename;
        usingRunner = _suman.usingRunner = _suman.usingRunner || process.env.SUMAN_RUNNER === 'yes';
        sumanConfig = load_suman_config_1.loadSumanConfig(null, null);
        if (!_suman.usingRunner && !_suman.viaSuman) {
            require('./helpers/print-version-info');
        }
        sumanPaths = resolve_shared_dirs_1.resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
        sumanObj = load_shared_objects_1.loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
        integrantPreFn = sumanObj.integrantPreFn;
        testDebugLogPath = sumanPaths.testDebugLogPath;
        fs.writeFileSync(testDebugLogPath, '\n');
        fs.appendFileSync(testDebugLogPath, '\n\n', { encoding: 'utf8' });
        _suman.writeTestError('\n ### Suman start run @' + new Date() + ' ###\n', true);
        _suman.writeTestError('\nCommand => ' + util.inspect(process.argv), true);
    }
    if (!projectRoot) {
        projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
        main = require.main.filename;
        usingRunner = _suman.usingRunner = _suman.usingRunner || process.env.SUMAN_RUNNER === 'yes';
        sumanConfig = load_suman_config_1.loadSumanConfig(null, null);
        if (!_suman.usingRunner && !_suman.viaSuman) {
            require('./helpers/print-version-info');
        }
        sumanPaths = resolve_shared_dirs_1.resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
        sumanObj = load_shared_objects_1.loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
        integrantPreFn = sumanObj.integrantPreFn;
        testDebugLogPath = sumanPaths.testDebugLogPath;
        fs.writeFileSync(testDebugLogPath, '\n');
        fs.appendFileSync(testDebugLogPath, '\n\n', { encoding: 'utf8' });
        _suman.writeTestError('\n ### Suman start run @' + new Date() + ' ###\n', true);
        _suman.writeTestError('\nCommand => ' + util.inspect(process.argv), true);
    }
    require('./handle-exit');
    require('./helpers/load-reporters-last-ditch').run();
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as the first argument to suman.init()');
    }
    if (confOverride) {
        assert(su.isObject(confOverride), 'Suman conf override value must be defined, and an object like so => {}.');
        Object.assign(_suman.sumanConfig, confOverride);
    }
    _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
    _suman._currentModule = $module.filename;
    if (!loaded) {
    }
    if ($opts) {
        assert(su.isObject($opts), 'Please pass an options object as a second argument to suman.init()');
    }
    var opts = $opts || {};
    if ($module.sumanInitted) {
        throw new Error("suman.init() already called for this module with filename => " + $module.filename);
    }
    $module.sumanInitted = true;
    opts.integrants && assert(Array.isArray(opts.integrants), "'integrants' option must be an array.");
    opts.pre && assert(Array.isArray(opts.pre), "'pre' option must be an array.");
    var $integrants = (opts.integrants || opts.pre || []).filter(function (i) { return i; }).map(function (item) {
        assert(typeof item === 'string', "once.pre item must be a string. Instead we have => " + util.inspect(item));
        return item;
    });
    var integrants = $integrants.filter(function (i) { return i; });
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
    opts.post && assert(Array.isArray(opts.post), "'post' option must be an array.");
    var $oncePost = (opts.post || []).filter(function (item) {
        assert(typeof item === 'string', "once.post key must be a string. Instead we have => " + util.inspect(item));
        return item;
    });
    allOncePostKeys.push($oncePost);
    allOncePreKeys.push(integrants);
    var _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var iocData = opts.iocData || opts.ioc || {};
    if (iocData) {
        try {
            assert(typeof iocData === 'object' && !Array.isArray(iocData), chalk.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
                'to point to an object'));
        }
        catch (err) {
            _suman.logError(err.stack || err);
            process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
        }
    }
    var integrantsFn = handle_integrants_1.handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
    exports.init.tooLate = false;
    var start = function () {
        var args = pragmatik.parse(arguments, rules.createSignature);
        args[1].__preParsed = true;
        if (exports.init.tooLate === true && !SUMAN_SINGLE_PROCESS) {
            console.error(' => Suman usage fatal error => You must call Test.create() synchronously => \n\t' +
                'in other words, all Test.create() calls should be registered in the same tick of the event loop.');
            return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
        }
        process.nextTick(function () {
            exports.init.tooLate = true;
        });
        var to = setTimeout(function () {
            console.error(' => Suman usage error => Integrant acquisition timeout.');
            process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
        }, _suman.weAreDebugging ? 50000000 : 50000);
        var onPreVals = function (vals) {
            clearTimeout(to);
            _suman['$pre'] = JSON.parse(su.customStringify(vals));
            _suman.userData = JSON.parse(su.customStringify(iocData));
            var suman = suman_1.makeSuman($module, _interface, opts);
            suman.iocData = JSON.parse(su.customStringify(iocData));
            var run = execSuite(suman);
            try {
                process.domain && process.domain.exit();
            }
            finally {
                global.setImmediate(function () {
                    testSuiteRegistrationQueue.push(function () {
                        run.apply(null, args);
                    });
                });
            }
        };
        acquire_ioc_static_deps_1.acquireIocStaticDeps()
            .catch(function (err) {
            clearTimeout(to);
            _suman.logError(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.IOC_STATIC_ACQUISITION_ERROR);
        })
            .then(function () {
            return integrantsFn();
        })
            .catch(function (err) {
            clearTimeout(to);
            _suman.logError(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
        })
            .then(onPreVals)
            .catch(function (err) {
            clearTimeout(to);
            _suman.logError(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.PRE_VALS_ERROR);
        });
    };
    var ret = {
        parent: $module.parent,
        file: $module.filename,
        create: start
    };
    initMap.set($module, ret);
    loaded = true;
    return ret.Test = ret;
};
exports.autoPass = function (t) {
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
            return;
        }
        fn.call(null, function (err, val) {
            if (!err) {
                cache = val || { 'Suman says': 'This is a dummy-cache val. See => sumanjs.org/tricks-and-tips.html' };
            }
            cb.call(null, err, cache);
        });
    };
};
try {
    window.suman = module.exports;
    console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}
var $exports = module.exports;
exports.default = $exports;
