'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var EE = require("events");
var fs = require("fs");
var chalk = require("chalk");
var pragmatik = require('pragmatik');
var debug = require('suman-debug')('s:index');
var inBrowser = false;
var _suman = global.__suman = (global.__suman || {});
_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');
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
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var async = require("async");
var constants = require('../config/suman-constants').constants;
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
require('./index-helpers/exit-handling');
var handle_integrants_1 = require("./index-helpers/handle-integrants");
var setup_extra_loggers_1 = require("./index-helpers/setup-extra-loggers");
var rules = require('./helpers/handle-varargs');
var suman_1 = require("./suman");
var su = require("suman-utils");
var execSuite = require('./exec-suite').execSuite;
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var load_suman_config_1 = require("./helpers/load-suman-config");
var resolve_shared_dirs_1 = require("./helpers/resolve-shared-dirs");
var load_shared_objects_1 = require("./helpers/load-shared-objects");
var acquire_ioc_static_deps_1 = require("./acquire-dependencies/acquire-ioc-static-deps");
var allOncePreKeys = _suman.oncePreKeys = [];
var allOncePostKeys = _suman.oncePostKeys = [];
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
if (!SUMAN_SINGLE_PROCESS) {
    require('./helpers/handle-suman-counts');
}
require('./index-helpers/verify-local-global-version');
var counts = require('./helpers/suman-counts');
var projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
var main = require.main.filename;
var usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');
var sumanConfig = load_suman_config_1.loadSumanConfig(null, null);
if (!_suman.usingRunner && !_suman.viaSuman) {
    require('./helpers/print-version-info');
}
var sumanPaths = resolve_shared_dirs_1.resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
var sumanObj = load_shared_objects_1.loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
var integrantPreFn = sumanObj.integrantPreFn;
var testDebugLogPath = sumanPaths.testDebugLogPath;
var testLogPath = sumanPaths.testLogPath;
fs.writeFileSync(testDebugLogPath, '\n', { flag: 'w' });
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), { flag: 'w' });
var loaded = false;
var testSuiteQueueCallbacks = [];
var c = (sumanOpts && sumanOpts.series) ? 1 : 3;
var testSuiteQueue = async.queue(function (task, cb) {
    testSuiteQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, c);
var testRuns = [];
var testSuiteRegistrationQueueCallbacks = [];
var testSuiteRegistrationQueue = async.queue(function (task, cb) {
    testSuiteRegistrationQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, 1);
testSuiteRegistrationQueue.drain = function () {
    testRuns.forEach(function (fn) {
        testSuiteQueue.push(fn);
    });
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
exports.init = function ($module, $opts, confOverride) {
    debugger;
    if (exports.init.$ingletonian) {
        if (!SUMAN_SINGLE_PROCESS) {
            _suman.logError(chalk.red('Suman usage warning => suman.init() only needs to be called once per test script.'));
            return exports.init.$ingletonian;
        }
    }
    if (this instanceof exports.init) {
        _suman.logError('Suman usage warning: no need to use "new" keyword with the suman.init()' +
            ' function as it is not a standard constructor');
        return exports.init.apply(null, arguments);
    }
    require('./handle-exit');
    require('./helpers/load-reporters-last-ditch').run();
    $module = $module || { filename: '/', exports: {} };
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as first arg to suman.init()');
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
    setup_extra_loggers_1.default(usingRunner, testDebugLogPath, testLogPath, $module);
    var integrantsFn = handle_integrants_1.handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
    exports.init.tooLate = false;
    var start = function (desc, opts, arr, cb) {
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
        }, _suman.weAreDebugging ? 50000000 : 500000);
        function onPreVals(vals) {
            clearTimeout(to);
            _suman['$pre'] = JSON.parse(su.customStringify(vals));
            _suman.userData = JSON.parse(su.customStringify(iocData));
            suman_1.makeSuman($module, _interface, true, sumanConfig, function (err, suman) {
                if (err) {
                    _suman.writeTestError(err.stack || err);
                    return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
                }
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
            });
        }
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
            _suman.logError(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.PRE_VALS_ERROR);
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
