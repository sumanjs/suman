/**
 * Created by t_millal on 10/17/16.
 */



//core
const assert = require('assert');
const util = require('util');

//npm
const _ = require('lodash');
const fnArgs = require('function-arguments');

//project
const constants = require('../config/suman-constants');

module.exports = function acquireDepsOriginal(deps, cb) {

    var obj = {};

    debugger;

    deps.forEach(dep => {

        //TODO, we should validate the suman.ioc.js file independently of this check, later on
        //TODO: Check to make sure dep name is not undefined?

        if (_.includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in global.iocConfiguration) {
            console.log('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved internal Suman dependency injection value.');
            throw new Error('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved internal Suman dependency injection value.');
        }

        else if (_.includes(constants.CORE_MODULE_LIST, dep && String(dep)) && String(dep) in global.iocConfiguration) {
            console.log('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved Node.js core module dependency injection value.');
            throw new Error('Warning: you added a IoC dependency for "' + dep + '" but this is a reserved Node.js core module dependency injection value.');
        }
        else if (_.includes(constants.CORE_MODULE_LIST, dep && String(dep)) || _.includes(constants.SUMAN_HARD_LIST, String(dep))) {
            //skip any dependencies
            obj[dep] = null;
        }
        else {

            obj[dep] = global.iocConfiguration[dep]; //copy subset of iocConfig to test suite

            if (!obj[dep] && !_.includes(constants.CORE_MODULE_LIST, String(dep)) && !_.includes(constants.SUMAN_HARD_LIST, String(dep))) {

                var deps = Object.keys(global.iocConfiguration || {}).map(function (item) {
                    return ' "' + item + '" ';
                });

                throw new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
                    ' => ...your available dependencies are: [' + deps + ']');
            }
        }

    });


    const temp = Object.keys(obj).map(function (key) {

        const fn = obj[key];

        return new Promise(function (resolve, reject) {

            if (!fn) {
                // most likely a core dep (assert, http, etc)
                // console.log(' => Suman warning => fn is null/undefined for key = "' + key + '"');
                process.nextTick(resolve);
            }
            else if (typeof fn !== 'function') {
                process.nextTick(function () {
                    const err = new Error('Value in IOC object was not a function for corresponding key => ' +
                        '"' + key + '", value => "' + util.inspect(fn) + '"');
                    console.log('\n', err.stack, '\n');
                    reject(err);
                });
            }
            else if (fn.length > 1) {
                var args = fnArgs(fn);
                var str = fn.toString();
                var matches = str.match(new RegExp(args[1], 'g')) || [];
                if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
                    throw new Error('Callback in your function was not present => ' + str);
                }
                fn.apply(global, [function (err, val) { //TODO what to use for ctx of this .apply call?
                    process.nextTick(function () {
                        err ? reject(err) : resolve(val);
                    });
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(resolve, reject);
            }

        });

    });


    Promise.all(temp).then(function (deps) {

        Object.keys(obj).forEach(function (key, index) {
            obj[key] = deps[index];
        });

        cb(null, obj);

    }, function (err) {
        console.error(err.stack || err);
        cb(err, {});

    }).catch(function (err) {
        console.error(err.stack || err);
    });

};