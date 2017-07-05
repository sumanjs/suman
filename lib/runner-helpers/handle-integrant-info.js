'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var util = require('util');
var domain = require('domain');
var path = require('path');
var EE = require('events');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var weAreDebugging = require('../helpers/we-are-debugging');
var acquireDependencies = require('../acquire-dependencies/acquire-pre-deps').acquireDependencies;
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
Object.defineProperty(_suman, 'integrantHashKeyVals', {
    writable: false,
    value: {}
});
exports.makeHandleIntegrantInfo = function (runnerObj, allOncePostKeys, integrantHashKeyVals) {
    return function handleIntegrantInfo(msg, n) {
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
        process.nextTick(function () {
            n.send({
                info: 'once-post-received'
            });
        });
        if (oncePostKeys.length > 0 && !runnerObj.innited) {
            try {
                runnerObj.innited = true;
                var oncePostModule = runnerObj.oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
                assert(typeof oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
                runnerObj.hasOncePostFile = true;
            }
            catch (err) {
                console.error(colors.red(' => Suman usage warning => you have suman.once.post data defined, ' +
                    'but no suman.once.post.js file.') + '\n' + (err.stack || err));
            }
        }
        var integrants = msg.msg;
        assert(Array.isArray(integrants), 'integrants must be an array.');
        var depContainerObj = runnerObj.depContainerObj;
        return acquireDependencies(integrants, depContainerObj).then(function (val) {
            var stringified;
            try {
                stringified = suman_utils_1.default.customStringify(val);
            }
            catch (err) {
                console.error(err.stack || err);
            }
            n.send({ info: 'all-integrants-ready', val: stringified });
        }, function (err) {
            console.error(err.stack || err);
            n.send({ info: 'integrant-error', data: String(err.stack || err) });
        });
    };
};
