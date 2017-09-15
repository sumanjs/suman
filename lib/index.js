'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var path = require("path");
var EE = require("events");
var fs = require("fs");
var stream = require("stream");
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
var moduleCount = 0;
var integrantsAlreadyInvoked = false;
var testSuiteQueueCallbacks = [];
var testSuiteQueue = async.queue(function (task, cb) {
    testSuiteQueueCallbacks.unshift(cb);
    task.call(null);
}, 1);
testSuiteQueue.drain = function () {
    suiteResultEmitter.emit('suman-test-file-complete');
};
suiteResultEmitter.on('suman-completed', function () {
    _suman.whichSuman = null;
    var fn = testSuiteQueueCallbacks.pop();
    fn && fn.call(null);
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
    if (!inBrowser) {
        assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as first arg to suman.init()');
    }
    if (confOverride) {
        assert(su.isObject(confOverride), ' => Suman conf override value must be defined, and an object like so => {}.');
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
    var opts = $opts || {};
    if ($module._sumanInitted) {
        _suman.logError('warning => suman.init() already called for ' +
            'this module with filename => ', $module.filename);
        return;
    }
    $module._sumanInitted = true;
    moduleCount++;
    var integrants;
    try {
        integrants = (opts.integrants || opts.pre || []).filter(function (i) { return i; }).map(function (item) {
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
            console.log(err.stack);
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
            console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
                'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
            return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
        }
        process.nextTick(function () {
            exports.init.tooLate = true;
        });
        counts.sumanCount++;
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
                catch (err) {
                }
                global.setImmediate(function () {
                    testSuiteQueue.unshift(function () {
                        run.apply(null, args);
                    });
                });
            });
        }
        acquire_ioc_static_deps_1.acquireIocStaticDeps().then(function () {
            if (!SUMAN_SINGLE_PROCESS && integrantsAlreadyInvoked) {
                _suman.logWarning('integrantsInvoked more than once for non-SUMAN_SINGLE_PROCESS mode run.', 'process.env.SUMAN_SINGLE_PROCESS => ' + process.env.SUMAN_SINGLE_PROCESS);
            }
            integrantsAlreadyInvoked = true;
            integrantsFn().then(onPreVals, function (err) {
                clearTimeout(to);
                _suman.logError(err.stack || err);
                _suman.writeTestError(err.stack || err);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
            });
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
                        'Suman says': 'This is a dummy-cache val. See => sumanjs.org/tricks-and-tips.html'
                    };
                }
                cb.call(null, err, cache);
            });
        }
    };
};
exports.load = function (opts) {
    if (typeof opts !== 'object') {
        throw new Error(' => Suman usage error => Please pass in an options object to the suman.load() function.');
    }
    var pth = opts.path;
    var indirect = Boolean(opts.indirect);
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
