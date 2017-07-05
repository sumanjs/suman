'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var util = require("util");
var EE = require("events");
var chalk = require("chalk");
var fnArgs = require("function-arguments");
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
Object.defineProperty(_suman, 'integrantHashKeyVals', {
    writable: false,
    value: {}
});
var integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
var acquireDependencies = require('../acquire-dependencies/acquire-pre-deps').acquireDependencies;
var suman_constants_1 = require("../../config/suman-constants");
var integrant_injector_1 = require("../injection/integrant-injector");
var IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var socketio_child_client_1 = require("./socketio-child-client");
var integPreConfiguration = null;
exports.handleIntegrants = function (integrants, $oncePost, integrantPreFn, $module) {
    var integrantsFn = null;
    var integrantsReady = null;
    var postOnlyReady = null;
    var waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
    var waitForIntegrantResponses = integrants.length > 0;
    if (waitForIntegrantResponses || IS_SUMAN_SINGLE_PROCESS) {
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
        var client_1 = socketio_child_client_1.getClient();
        integrantsFn = function () {
            var integrantsFromParentProcess = [];
            var oncePreVals;
            if (integrantsReady) {
                process.nextTick(function () {
                    integrantsEmitter.emit('vals', {});
                });
            }
            else {
                var integrantMessage_1 = function (msg) {
                    if (msg.info === 'all-integrants-ready') {
                        oncePreVals = JSON.parse(msg.val);
                        integrantsReady = true;
                        if (postOnlyReady !== false) {
                            process.removeListener('message', integrantMessage_1);
                            integrantsEmitter.emit('vals', oncePreVals);
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
                var INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
                client_1.on(INTEGRANT_INFO, integrantMessage_1);
                client_1.emit(INTEGRANT_INFO, {
                    type: INTEGRANT_INFO,
                    msg: integrants,
                    oncePost: $oncePost,
                    expectedExitCode: _suman.expectedExitCode,
                    expectedTimeout: _suman.expectedTimeout,
                    childId: process.env.SUMAN_CHILD_ID
                });
            }
        };
    }
    else {
        integrantsFn = function (emitter) {
            if (!integPreConfiguration) {
                var args = fnArgs(integrantPreFn);
                var ret = integrantPreFn.apply(null, integrant_injector_1.default(args));
                if (ret && suman_utils_1.default.isObject(ret.dependencies)) {
                    integPreConfiguration = ret.dependencies;
                }
                else {
                    throw new Error(' => <suman.once.pre.js> file does not export an object with a property called "dependencies".');
                }
            }
            var d = domain.create();
            d.once('error', function (err) {
                console.error(chalk.magenta(' => Your test was looking to source the following integrant dependencies:\n', chalk.cyan(util.inspect(integrants)), '\n', 'But there was a problem.'));
                err = new Error(' => Suman fatal error => there was a problem verifying the ' +
                    'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));
                console.error(err.stack || err);
                _suman._writeTestError(err.stack || err);
                process.exit(suman_constants_1.constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
            });
            d.run(function () {
                acquireDependencies(integrants, integPreConfiguration).then(function (vals) {
                    d.exit();
                    process.nextTick(function () {
                        integrantsEmitter.emit('vals', Object.freeze(vals));
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
    return integrantsFn;
};
