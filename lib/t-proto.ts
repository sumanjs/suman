'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const EE = require('events');

//project
const _suman = global.__suman = (global.__suman || {});
const freezeExistingProps = require('./freeze-existing');

////////////////////////////////////////////////////////////////

const $proto = Object.create(Function.prototype);
const proto = Object.create(Object.assign($proto, EE.prototype));


proto.wrap = function _wrap(fn: Function) {
    const self = this;
    return function () {
        try {
            fn.apply(this, arguments);
        } catch (e) {
            self.__handle(e, false);
        }
    }
};

proto.wrapErrorFirst = function _wrapErrorFirstCB(fn: Function) {
  const self = this;
  return function (err: IPsuedoError) {
    if(err){
      return self.__handle(err, false);
    }
    try {
      // remove the error-first argument
      fn.apply(this, Array.from(arguments).splice(1,1));
    } catch (e) {
      self.__handle(e, false);
    }
  }
};


proto.log = function log() {  //TODO: update this
    _suman._writeLog.apply(null, arguments);
};

proto.slow = function slow() {

};


export = freezeExistingProps(proto);


