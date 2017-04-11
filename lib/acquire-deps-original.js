'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');
const util = require('util');
const EE = require('events');

//npm
const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../config/suman-constants');
const iocEmitter = _suman.iocEmitter = (_suman.iocEmitter || new EE());
const iocContainer = _suman.iocContainer = (_suman.iocContainer || {});
const iocProgressContainer = _suman.iocProgressContainer = (_suman.iocProgressContainer || {});

/////////////////////////////////////////////////////////////////////////////

iocEmitter.setMaxListeners(250); //magic number ftw

//////////////////////////////////////////////////////////////////////////////

module.exports = function acquireDepsOriginal(deps, cb) {

  const obj = {};

  deps.forEach(dep => {

    //TODO, we should validate the suman.ioc.js file independently of this check, later on
    //TODO: Check to make sure dep name is not undefined?

    if (includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in _suman.iocConfiguration) {
      console.log('Warning: you added a IoC dependency for "' + dep +
        '" but this is a reserved internal Suman dependency injection value.');
      throw new Error('Warning: you added a IoC dependency for "' + dep +
        '" but this is a reserved internal Suman dependency injection value.');
    }

    else if (includes(constants.CORE_MODULE_LIST, dep && String(dep)) && String(dep) in _suman.iocConfiguration) {
      console.log('Warning: you added a IoC dependency for "' + dep
        + '" but this is a reserved Node.js core module dependency injection value.');
      throw new Error('Warning: you added a IoC dependency for "' + dep
        + '" but this is a reserved Node.js core module dependency injection value.');
    }

    //TODO: maybe just fill these in here instead of later
    else if (includes(constants.CORE_MODULE_LIST, dep && String(dep)) || includes(constants.SUMAN_HARD_LIST, String(dep))) {
      //skip any dependencies
      obj[dep] = null;
    }
    else {

      obj[dep] = _suman.iocConfiguration[dep]; //copy subset of iocConfig to test suite

      if (!obj[dep] && !includes(constants.CORE_MODULE_LIST, String(dep)) && !includes(constants.SUMAN_HARD_LIST, String(dep))) {

        let deps = Object.keys(_suman.iocConfiguration || {}).map(function (item) {
          return ' "' + item + '" ';
        });

        const err = new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
          ' => ...your available dependencies are: [' + deps + ']');

        _suman._writeTestError(err.stack);

      }
    }

  });

  const temp = Object.keys(obj).map(function (key) {

    const fn = obj[key];
    const cache = iocContainer[key];
    const inProgress = iocProgressContainer[key];

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
      else if (cache) {
        if (process.env.SUMAN_DEBUG === 'yes') {
          console.log('CACHE WAS USED for key = "' + key + '"');
        }
        assert(inProgress === 'done', 'iocProgressContainer should have "done" value for key = "' + key + '"');
        process.nextTick(function () {
          resolve(cache);
        });
      }
      else if (inProgress === true) {
        if (process.env.SUMAN_DEBUG === 'yes') {
          console.log('IN PROGRESS WAS USED for key = "' + key + '".');
        }

        iocEmitter.once(key, resolve);
        iocEmitter.once('error', reject);
      }
      else if (fn.length > 1) {
        reject(new Error(colors.red(' => Suman usage error => suman.ioc.js functions take 0 or 1 arguments, with the single argument being a callback function.')));
      }
      else if (fn.length > 0) {
        let args = fnArgs(fn);
        let str = fn.toString();
        let matches = str.match(new RegExp(args[1], 'g')) || [];
        if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
          throw new Error('Callback in your function was not present => ' + str);
        }

        if (key in iocProgressContainer) {
          throw new Error(' => Suman internal error => "' + key + '" should not already be in iocProgressContainer');
        }
        iocProgressContainer[key] = true;

        //TODO what to use for ctx of this .apply call?
        fn.call(global, function (err, val) {
          process.nextTick(function () {
            if (err) {
              // iocProgressContainer[key] = err;
              // TODO: should we really put the error in the cache?
              iocEmitter.emit('error', err);
              reject(err);
            }
            else {
              iocProgressContainer[key] = 'done';
              iocContainer[key] = val;
              iocEmitter.emit(key, val);
              resolve(val);
            }
          });
        });
      }
      else {

        if (key in iocProgressContainer) {
          throw new Error(' => Suman internal error => "' + key + '" should not already be in iocProgressContainer');
        }

        iocProgressContainer[key] = true;

        Promise.resolve(fn.call(null)).then(function res(val) {
          iocContainer[key] = val;
          iocProgressContainer[key] = 'done';
          iocEmitter.emit(key, val);
          resolve(val);
        }, function rej(err) {
          iocProgressContainer[key] = err;
          iocEmitter.emit('error', err);
          reject(err);
        });
      }

    });

  });

  Promise.all(temp).then(function (deps) {

      Object.keys(obj).forEach(function (key, index) {
        obj[key] = deps[index];
      });
      //want to exit out of current tick
      process.nextTick(function () {
        cb(null, obj);
      });

    },
    function (err) {
      console.error(err.stack || err);
      //want to exit out of current tick
      process.nextTick(function () {
        cb(err, {});
      });
    });
};
