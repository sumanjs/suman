'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISumanServerInfo} from "suman-types/dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');
import os = require('os');
import path = require('path');

//npm
import su from 'suman-utils';
import {events} from 'suman-events';

//project`
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import SumanErrors from '../misc/suman-errors';
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////

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
    resultBroadcaster.emit(String(events.USING_SERVER_MARKED_BY_HOSTNAME), hostname, server);
  }

  else if (sumanConfig.servers && sumanConfig.servers['*default']) {
    server = sumanConfig.servers['*default'];
    resultBroadcaster.emit(String(events.USING_DEFAULT_SERVER), '*default', server);
  }

  else {
    server = Object.freeze({host: '127.0.0.1', port: 6969});
    resultBroadcaster.emit(String(events.USING_FALLBACK_SERVER), server);
  }

  if (!server.host) SumanErrors.noHost(true);
  if (!server.port) SumanErrors.noPort(true);

  return server;

};
