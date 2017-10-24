'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var assert = require("assert");
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var weAreDebugging = su.weAreDebugging;
var suman_constants_1 = require("../../config/suman-constants");
var acquirePreDeps = require('../acquire-dependencies/acquire-pre-deps').acquirePreDeps;
if (!('integrantHashKeyVals' in _suman)) {
    Object.defineProperty(_suman, 'integrantHashKeyVals', {
        writable: false,
        value: {}
    });
}
exports.makeHandleIntegrantInfo = function (runnerObj, allOncePostKeys, integrantHashKeyVals) {
    var INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
    return function handleIntegrantInfo(msg, n, s) {
        var oncePostKeys = msg.oncePost;
        if (Number.isInteger(msg.expectedExitCode)) {
            n.expectedExitCode = msg.expectedExitCode;
        }
        else if (msg.expectedExitCode !== undefined) {
            throw new Error(' => Suman implementation error => expected exit code not an integer ' +
                'for child process => ' + n.testPath);
        }
        if (Number.isInteger(msg.expectedTimeout)) {
            if (!weAreDebugging) {
                clearTimeout(n.to);
                n.to = setTimeout(function () {
                    n.kill();
                }, msg.expectedTimeout);
            }
        }
        else if (msg.expectedTimeout !== undefined) {
            throw new Error(' => Suman implementation error => expected timeout not an acceptable integer ' +
                'for child process => ' + n.testPath);
        }
        assert(Array.isArray(oncePostKeys), 'oncePostKeys is not an array type.');
        allOncePostKeys.push(oncePostKeys);
        s.emit(INTEGRANT_INFO, {
            info: 'once-post-received'
        });
        if (oncePostKeys.length > 0 && !runnerObj.innited) {
            try {
                runnerObj.innited = true;
                var oncePostModule = runnerObj.oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
                assert(typeof oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
                runnerObj.hasOncePostFile = true;
            }
            catch (err) {
                _suman.log.error(chalk.red('Suman usage warning => you have suman.once.post data defined, ' +
                    'but no suman.once.post.js file.') + '\n' + su.getCleanErrorString(err));
            }
        }
        var integrants = msg.msg;
        assert(Array.isArray(integrants), 'integrants must be an array.');
        var depContainerObj = runnerObj.depContainerObj;
        if (!depContainerObj) {
            throw new Error('suman implementation error, missing definition.');
        }
        return acquirePreDeps(integrants, depContainerObj).then(function (val) {
            var stringified;
            try {
                stringified = su.customStringify(val);
            }
            catch (err) {
                _suman.log.error(su.getCleanErrorString(err));
            }
            s.emit(INTEGRANT_INFO, { info: 'all-integrants-ready', val: stringified });
        }, function (err) {
            var strErr = su.getCleanErrorString(err);
            _suman.log.error(strErr);
            s.emit(INTEGRANT_INFO, { info: 'integrant-error', data: strErr });
        });
    };
};
