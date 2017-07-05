'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const debug = require('suman-debug')('s:cli');

//project
const _suman = global.__suman = (global.__suman || {});
let callable = true;

///////////////////////////////////////////////////////////////////////////////////////////////////

export const fatalRequestReply = function (obj: Object, cb: Function) {

  console.error('obj in fatal request reply => ', obj);
  _suman.sumanUncaughtExceptionTriggered = obj;

  if (callable) {
    callable = false;
  }
  else {
    console.log('callabled is false...');
    // if callable is false (we already called this function) then fire callback immediately
    return process.nextTick(cb);
  }

  if(_suman.$forceInheritStdio){
    // we need to use TAP to write test output, instead of sending via process.send
    console.log('$forceInheritStdio');
    return process.nextTick(cb);
  }

  if (!_suman.usingRunner) {
    _suman.logError('warning => Not using runner in this process, so we will never get reply, firing callback now.');
    return process.nextTick(cb);
  }

  process.on('message', function onFatalMessageReceived(msg: any) {
    const to = setTimeout(function () {
      process.removeListener('message', onFatalMessageReceived);
      return process.nextTick(cb);
    }, 3500);

    if (msg.info = 'fatal-message-received') {
      clearTimeout(to);
      process.removeListener('message', onFatalMessageReceived);
      process.nextTick(cb);
    }
  });


  console.log('waiting for response from runner...');
  process.send(obj);

};
