'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var define_options_classes_1 = require("./test-suite-helpers/define-options-classes");
var s = require("./s");
exports.s = s;
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
if (process.env.IS_SUMAN_BROWSER_TEST === 'yes') {
    throw new Error('This file should not be loaded if the process.env.IS_SUMAN_BROWSER_TEST var is set to "yes".');
}
var util = require("util");
var assert = require("assert");
var EE = require("events");
var fs = require("fs");
var chalk = require("chalk");
var su = require("suman-utils");
var async = require("async");
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var inBrowser = false, usingKarma = false;
var sumanRun = require("./helpers/suman-run");
_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');
var socketio_child_client_1 = require("./index-helpers/socketio-child-client");
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
    _suman.log.error(su.getCleanErrorString(e));
});
try {
    if (window) {
        sumanOpts.series = true;
        fs = require('suman-browser-polyfills/modules/fs');
    }
}
catch (err) {
}
try {
    window.onerror = function (e) {
        console.error('window onerror event', e);
    };
    window.suman = module.exports;
    console.log(' => "suman" is now available as a global variable in the browser.');
    inBrowser = _suman.inBrowser = true;
    if (window.__karma__) {
        usingKarma = _suman.usingKarma = true;
        _suman.sumanOpts && _suman.sumanOpts.force;
        true;
    }
}
catch (err) {
    inBrowser = _suman.inBrowser = false;
}
if (!_suman.sumanOpts) {
    _suman.log.warning('implementation warning: sumanOpts is not yet defined in runtime.');
}
if (_suman.sumanOpts && _suman.sumanOpts.verbosity > 8) {
    _suman.log.info(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
}
require('./index-helpers/exit-handling');
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var constants = require('../config/suman-constants').constants;
var handle_integrants_1 = require("./index-helpers/handle-integrants");
var rules = require("./helpers/handle-varargs");
var suman_1 = require("./suman");
var exec_suite_1 = require("./exec-suite");
var general_1 = require("./helpers/general");
var acquire_ioc_static_deps_1 = require("./acquire-dependencies/acquire-ioc-static-deps");
var handle_suman_shutdown_1 = require("./helpers/handle-suman-shutdown");
var allOncePreKeys = _suman.oncePreKeys = [];
var allOncePostKeys = _suman.oncePostKeys = [];
var suiteResultEmitter = _suman.suiteResultEmitter = _suman.suiteResultEmitter || new EE();
var initMap = new Map();
if (!SUMAN_SINGLE_PROCESS && !inBrowser) {
    handle_suman_shutdown_1.handleSingleFileShutdown();
}
require('./index-helpers/verify-local-global-version');
var projectRoot, loaded = false, sumanConfig, main, usingRunner, testDebugLogPath, sumanPaths, sumanObj, integrantPreFn;
var testSuiteQueueCallbacks = [];
var testRuns = [];
var testSuiteRegistrationQueueCallbacks = [];
var c = (sumanOpts && sumanOpts.series) ? 1 : 3;
var testSuiteQueue = _suman.tsq = async.queue(function (task, cb) {
    testSuiteQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, c);
var testSuiteRegistrationQueue = _suman.tsrq = async.queue(function (task, cb) {
    testSuiteRegistrationQueueCallbacks.unshift(cb);
    process.nextTick(task);
}, c);
testSuiteRegistrationQueue.drain = function () {
    if (su.vgt(5)) {
        var suites = testRuns.length === 1 ? 'suite' : 'suites';
        _suman.log.info("Pushing " + testRuns.length + " test " + suites + " onto queue with concurrency " + c + ".\n\n");
    }
    while (testRuns.length > 0) {
        testSuiteQueue.push(testRuns.shift());
    }
};
testSuiteQueue.drain = function () {
    suiteResultEmitter.emit('suman-test-file-complete');
    if (inBrowser && testSuiteRegistrationQueue.idle()) {
        handle_suman_shutdown_1.shutdownProcess();
    }
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
if (inBrowser) {
    if (!window.__karma__) {
        var client_1 = socketio_child_client_1.getClient();
        testSuiteRegistrationQueue.pause();
        setImmediate(function () {
            require('./handle-browser').run(testSuiteRegistrationQueue, testSuiteQueue, client_1);
        });
    }
}
exports.init = function ($module, $opts, sumanOptsOverride, confOverride) {
    debugger;
    require('./handle-exit');
    if (this instanceof exports.init) {
        throw new Error('no need to use "new" keyword with the suman.init() function as it is not a constructor.');
    }
    if (initMap.size > 0 && !SUMAN_SINGLE_PROCESS) {
        _suman.log.error(chalk.red('Suman usage warning => suman.init() only needs to be called once per test script.'));
    }
    if (!$module) {
        throw new Error('please pass a module instance to suman.init(), e.g., suman.init(module).');
    }
    if (initMap.get($module)) {
        return initMap.get($module);
    }
    if (typeof _suman.sumanConfig === 'string') {
        _suman.sumanConfig = JSON.parse(_suman.sumanConfig);
    }
    if (typeof _suman.sumanOpts === 'string') {
        _suman.log.info('Parsing global suman-options.');
        _suman.sumanOpts = JSON.parse(_suman.sumanOpts);
        _suman.sumanOpts.series = true;
        _suman.sumanOpts.force = true;
    }
    if (!$module.filename) {
        _suman.log.warning("warning: module instance did not have a 'filename' property.");
        $module.filename = '/';
    }
    if (!$module.exports) {
        _suman.log.warning("warning: module instance did not have an 'exports' property.");
        $module.exports = {};
    }
    if (!loaded) {
        _suman.sumanInitCalled = true;
        require('./helpers/load-reporters-last-ditch').run();
        projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
        main = require.main.filename;
        usingRunner = _suman.usingRunner = _suman.usingRunner || process.env.SUMAN_RUNNER === 'yes';
        sumanConfig = general_1.loadSumanConfig(null, null);
        if (!_suman.usingRunner && !_suman.viaSuman) {
            require('./helpers/print-version-info');
        }
        sumanPaths = general_1.resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
        sumanObj = general_1.loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
        integrantPreFn = sumanObj.integrantPreFn;
        testDebugLogPath = sumanPaths.testDebugLogPath;
        fs.writeFileSync(testDebugLogPath, '\n');
        fs.appendFileSync(testDebugLogPath, '\n\n', { encoding: 'utf8' });
        _suman.writeTestError('\n ### Suman start run @' + new Date() + ' ###\n', true);
        _suman.writeTestError('\nCommand => ' + util.inspect(process.argv), true);
    }
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as the first argument to suman.init()');
    }
    var _sumanConfig = _suman.sumanConfig, _sumanOpts = _suman.sumanOpts;
    if (sumanOptsOverride) {
        assert(su.isObject(sumanOptsOverride), 'Suman opts override value must be a plain object.');
        Object.keys(sumanOptsOverride).forEach(function (k) {
            if (String(k).startsWith('$')) {
                throw new Error('Suman options override object key must not start with "$" character.');
            }
            sumanOptsOverride['$' + k] = sumanOptsOverride[k];
            delete sumanOptsOverride[k];
        });
        _sumanOpts = Object.assign(_suman.sumanOpts, sumanOptsOverride, _suman.sumanOpts);
    }
    if (confOverride) {
        assert(su.isObject(confOverride), 'Suman conf override value must be a plain object.');
        _sumanConfig = Object.assign({}, _suman.sumanConfig, confOverride);
    }
    _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
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
    var iocData = opts.iocData || opts.ioc || {};
    if (iocData) {
        try {
            assert(typeof iocData === 'object' && !Array.isArray(iocData), chalk.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
                'to point to an object'));
        }
        catch (err) {
            _suman.log.error(err.stack || err);
            process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
        }
    }
    var integrantsFn = handle_integrants_1.handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
    var start = function ($$desc, $$opts) {
        var args = pragmatik.parse(arguments, rules.createSignature, {
            preParsed: su.isObject($$opts) && $$opts.__preParsed
        });
        args[1].__preParsed = true;
        if (start.tooLate === true) {
            console.error(' => Suman usage fatal error => You must call Test.create() synchronously => \n\t' +
                'in other words, all Test.create() calls should be registered in the same tick of the event loop.');
            return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
        }
        process.nextTick(function () {
            start.tooLate = true;
        });
        var to = setTimeout(function () {
            console.error('Suman usage error => Integrant acquisition timeout.');
            process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
        }, _suman.weAreDebugging ? 50000000 : 50000);
        var onPreVals = function (vals) {
            clearTimeout(to);
            _suman['$pre'] = JSON.parse(su.customStringify(vals));
            _suman.userData = JSON.parse(su.customStringify(iocData));
            var suman = suman_1.makeSuman($module, opts, _sumanOpts, _sumanConfig);
            suman.iocData = JSON.parse(su.customStringify(iocData));
            var run = exec_suite_1.execSuite(suman);
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
            _suman.log.error(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.IOC_STATIC_ACQUISITION_ERROR);
        })
            .then(function () {
            return integrantsFn();
        })
            .catch(function (err) {
            clearTimeout(to);
            _suman.log.error(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
        })
            .then(onPreVals)
            .catch(function (err) {
            clearTimeout(to);
            _suman.log.error(err.stack || err);
            _suman.writeTestError(err.stack || err);
            process.exit(constants.EXIT_CODES.PRE_VALS_ERROR);
        });
        return this;
    };
    var ret = {
        parent: $module.parent ? $module.parent.filename : null,
        file: $module.filename,
        create: start,
        define: function (desc, f) {
            if (typeof desc === 'function') {
                f = desc;
                desc = null;
            }
            var defObj = new define_options_classes_1.DefineObjectContext(desc, start);
            if (f) {
                assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
                f.call(null, defObj);
            }
            return defObj;
        }
    };
    initMap.set($module, ret);
    loaded = true;
    return ret.Test = ret;
};
exports.autoPass = function (t) {
    _suman.log.warning("test with description " + t.desc + " has automatically passed.");
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
exports.run = sumanRun.run();
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
var $exports = module.exports;
exports.default = $exports;
