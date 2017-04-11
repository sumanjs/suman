'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const EE = require('events');
const os = require('os');
const path = require('path');

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const SumanErrors = require('../config/suman-errors');
const sumanUtils = require('suman-utils');
const events = require('suman-events');

////////////////////////////////////////////////////////////////////////////////////

module.exports = function findSumanServer(serverName) {

  const sumanConfig = _suman.sumanConfig;

  debugger;

  let server = null;
  let hostname = os.hostname();

  if (sumanConfig.servers && serverName) {
    if (sumanConfig.servers[serverName]) {
      server = sumanConfig.servers[serverName];
    }
    else {
      throw new Error(' => Suman usage error => Bad server name ("' + serverName + '"), it does not match any ' +
        'properties on the servers properties in your suman.conf.js file.');
    }
  }
  else if (sumanConfig.servers && sumanConfig.servers[hostname]) {
    server = sumanConfig.servers[hostname];
    _suman.resultBroadcaster.emit(String(events.USING_SERVER_MARKED_BY_HOSTNAME), hostname, server);
  }

  else if (sumanConfig.servers && sumanConfig.servers['*default']) {
    server = sumanConfig.servers['*default'];
    _suman.resultBroadcaster.emit(String(events.USING_DEFAULT_SERVER), '*default', server);
  }

  else {
    server = Object.freeze({
      host: '127.0.0.1',
      port: 6969
    });
    _suman.resultBroadcaster.emit(String(events.USING_FALLBACK_SERVER), server);
  }

  if (!server.host) SumanErrors.noHost(true);
  if (!server.port) SumanErrors.noPort(true);

  return server;

};
