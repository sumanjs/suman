'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
const debug = require('suman-debug')('s:cli');
import su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
import {constants} from '../../config/suman-constants';
import {getClient} from '../index-helpers/socketio-child-client';
let callable = true;

///////////////////////////////////////////////////////////////////////////////////////////////////

export const fatalRequestReply = function (obj: Object, $cb: Function) {

  // console.error('obj in fatal request reply => ', obj);
  // console.error(new Error('msg').stack);

  const cb = su.once(null, $cb);
  _suman.sumanUncaughtExceptionTriggered = obj;

  if (callable) {
    callable = false;
  }
  else {
    console.log('callabled is false...');
    // if callable is false (we already called this function) then fire callback immediately
    return process.nextTick(cb);
  }

  if (_suman.$forceInheritStdio) {
    // we need to use TAP to write test output, instead of sending via process.send
    console.log('$forceInheritStdio');
    return process.nextTick(cb);
  }

  if (!_suman.usingRunner) {
    return process.nextTick(cb);
  }

  let client = getClient();

  const FATAL = constants.runner_message_type.FATAL;
  const FATAL_MESSAGE_RECEIVED = constants.runner_message_type.FATAL_MESSAGE_RECEIVED;

  const to = setTimeout(cb, 2500);

  client.once(FATAL_MESSAGE_RECEIVED, function () {
      clearTimeout(to);
      process.nextTick(cb);
  });

  console.log('client sent fatal message to runner; waiting for response from runner...');
  obj.childId = process.env.SUMAN_CHILD_ID;
  client.emit(FATAL, obj);

};
