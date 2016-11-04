'use strict';

//core
const assert = require('assert');

//npm
const _ = require('lodash');

//project
const constants = require('../config/suman-constants');


module.exports = function (suite, deps, cb) {

    const $deps = [];

    Object.keys(deps).forEach(function (key, index) {  //iterate over original array

        const dep = deps[key];

        if (dep) {
            $deps.push(dep);
        }
        else if (_.includes(constants.CORE_MODULE_LIST, key)) {
            $deps.push(require(key))
        }
        else if (_.includes(constants.SUMAN_HARD_LIST, key)) {
            switch (key) {
                case 'suite':
                    $deps.push(suite);
                    break;
                case 'describe':
                case 'before':
                case 'after':
                case 'beforeEach':
                case 'afterEach':
                case 'it':
                    assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
                    $deps.push(suite[key]);
                    break;
                case 'test':
                case 'setup':
                case 'teardown':
                case 'setupTest':
                case 'teardownTest':
                    assert(suite.interface === 'TDD', ' => Suman usage error, using the wrong interface.');
                    $deps.push(suite[key]);
                    break;
                case 'userData':
                    $deps.push(global.userData);
                    break;
                default:
                    throw new Error('Not implemented yet => "' + key + '"');
            }
        }
        else if (dep !== undefined) {
            console.error(' => Suman warning => value of dependency for key ="' + key + '" may be unexpected value => ', dep);
            $deps.push(dep);
        }
        else {
            throw new Error(' => Suman usage error => Dependency not met for: "' + key + '", dependency value is undefined =>' + dep);
        }

    });

    cb(null, $deps);
};