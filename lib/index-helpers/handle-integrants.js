"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var util = require("util");
var EE = require("events");
var fnArgs = require("function-arguments");
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
var fatalRequestReply = require('../helpers/fatal-request-reply').fatalRequestReply;
var acquireDeps = require('../acquire-deps');
var suman_constants_1 = require("../../config/suman-constants");
var integrantInjector = require('../injection/integrant-injector');
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var integPreConfiguration = null;
function default_1(integrants, $oncePost, integrantPreFn, $module) {
    var integrantsFn = null;
    var integrantsReady = null;
    var postOnlyReady = null;
    var waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
    var waitForIntegrantResponses = integrants.length > 0;
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
                        if (suman_utils_1.default.checkForEquality(integrants, integrantsFromParentProcess)) {
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
                    type: suman_constants_1.constants.runner_message_type.INTEGRANT_INFO,
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
                if (ret && suman_utils_1.default.isObject(ret.dependencies)) {
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
                    type: suman_constants_1.constants.runner_message_type.FATAL,
                    data: {
                        msg: err,
                        stack: err
                    }
                }, function () {
                    _suman._writeTestError(err.stack || err);
                    process.exit(suman_constants_1.constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
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
    return integrantsFn;
}
exports.default = default_1;
