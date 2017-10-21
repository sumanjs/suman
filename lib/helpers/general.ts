'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import {IAllOpts} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {ISumanServerInfo} from "suman-types/dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import assert = require('assert');
import EE = require('events');
import os = require('os');

//npm
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {events} from 'suman-events';
import {constants} from '../../config/suman-constants';
import {ITableDataCallbackObj} from "../../../suman-types/dts/suman";
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const results: Array<ITableDataCallbackObj> = _suman.tableResults = (_suman.tableResults || []);
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {getClient} from '../index-helpers/socketio-child-client';

//////////////////////////////////////////////////////////////////////////////

export interface ICloneErrorFn {
  (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError
}

///////////////////////////////////////////////////////////////////////////////

let fatalRequestReplyCallable = true;

///////////////////////////////////////////////////////////////////////////////////////////////////

export const fatalRequestReply = function (obj: Object, $cb: Function) {

  // console.error('obj in fatal request reply => ', obj);
  // console.error(new Error('msg').stack);

  const cb = su.once(null, $cb);
  _suman.sumanUncaughtExceptionTriggered = obj;

  if (fatalRequestReplyCallable) {
    fatalRequestReplyCallable = false;
  }
  else {
    // if callable is false (we already called this function) then fire callback immediately
    return process.nextTick(cb);
  }

  if (_suman.$forceInheritStdio) {
    // we need to use TAP to write test output, instead of sending via process.send
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


export const findSumanServer = function (serverName?: string): ISumanServerInfo {

  const sumanConfig = _suman.sumanConfig;
  let server = null;
  let hostname = os.hostname();

  if (sumanConfig.servers && serverName) {
    if (sumanConfig.servers[serverName]) {
      server = sumanConfig.servers[serverName];
    }
    else {
      throw new Error('Suman usage error => Bad server name ("' + serverName + '"), it does not match any ' +
        'properties on the servers properties in your suman.conf.js file.');
    }
  }
  else if (sumanConfig.servers && sumanConfig.servers[hostname]) {
    server = sumanConfig.servers[hostname];
    rb.emit(String(events.USING_SERVER_MARKED_BY_HOSTNAME), hostname, server);
  }

  else if (sumanConfig.servers && sumanConfig.servers['*default']) {
    server = sumanConfig.servers['*default'];
    rb.emit(String(events.USING_DEFAULT_SERVER), '*default', server);
  }

  else {
    server = Object.freeze({host: '127.0.0.1', port: 6969});
    rb.emit(String(events.USING_FALLBACK_SERVER), server);
  }

  if (!server.host) throw new Error('no suman-server host specified.');
  if (!server.port) throw new Error('no suman-server port specified.');

  return server;

};


export const makeOnSumanCompleted = function (suman: ISuman) {

  return function onSumanCompleted(code: number, msg: string) {

    suman.sumanCompleted = true;

    process.nextTick(function () {

      suman.logFinished(code || 0, msg, function (err: Error | string, val: any) {

        //TODO: val is not "any"

        if (_suman.sumanOpts.check_memory_usage) {
          _suman.logError('Maximum memory usage during run => ' + util.inspect({
            heapTotal: _suman.maxMem.heapTotal / 1000000,
            heapUsed: _suman.maxMem.heapUsed / 1000000
          }));
        }

        results.push(val);
        suiteResultEmitter.emit('suman-completed');
      });

    });

  };
};


export const cloneError: ICloneErrorFn = function (err, newMessage, stripAllButTestFilePathMatch) {

  const obj = {} as IPseudoError;
  obj.message = newMessage || `Suman implementation error: "newMessage" is not defined. Please report: ${constants.SUMAN_ISSUE_TRACKER_URL}.`;
  let temp;
  if (stripAllButTestFilePathMatch !== false) {
    temp = su.createCleanStack(String(err.stack || err));
  }
  else{
    temp = String(err.stack || err).split('\n');
  }
  temp[0] = newMessage;

  obj.message = newMessage;
  obj.stack = temp.join('\n');
  return obj;

};

export const parseArgs =  function (args: Array<any>, fnIsRequired?: boolean) {

  let [desc, opts, arr, fn] = args;

  if (arr && fn) {
    //TODO: we should reference the clone error from each hook or test case
    throw new Error('Suman usage error. Please define either an array or callback.');
  }

  let arrayDeps: Array<IAllOpts>;

  if (arr) {
    //note: you can't stub a test block!
    if (typeof arr[arr.length - 1] === 'function') {
      fn = arr[arr.length - 1];
      arrayDeps = arr.slice(0, -1);
    }
    else{
      arrayDeps = arr.slice(0);
    }
  }

  if (fnIsRequired) {
    assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
      'You need to pass a function as the last argument to the array.');
    // remove last element
  }

  desc = desc || (fn ? fn.name : '(suman unknown name)');

  //avoid unncessary pre-assignment
  arrayDeps = arrayDeps || [];

  return {
    arrayDeps,
    // we don't need to pass the array back
    args: [desc, opts, fn]
  }
};

export const evalOptions = function (arrayDeps: Array<IAllOpts>, opts: IAllOpts){

  const preVal = arrayDeps.filter(function (a: IAllOpts) {
    if(typeof a === 'string'){
      if (/.*:.*/.test(a)) {
        return a;
      }
      if (/:/.test(a)) {
        _suman.logWarning('Looks like you have a bad value in your options as strings =>', util.inspect(arrayDeps))
      }
    }
    else if(su.isObject(a)) {
      Object.assign(opts, a);
    }
    else{
      _suman.logWarning('You included an unexpected value in the array =>', util.inspect(arrayDeps))
    }
  });

  const toEval = `(function(){return {${preVal.join(',')}}})()`;

  try {
    const obj = eval(toEval);
    //overwrite opts with values from array
    Object.assign(opts, obj);
  }
  catch (err) {
    console.error('\n');
    _suman.logError('Could not evaluate the options passed via strings => ', util.inspect(preVal));
    _suman.logError('Suman will continue optimistically.');
    _suman.logError(err.stack || err);
    console.error('\n');
  }

};

