'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import * as Client from 'socket.io-client';
import su = require('suman-utils');

//project
let client: SocketIOClient.Socket = null;
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////

export const getClient = function () {
  
  if (!client) {
    
    let port = process.env.SUMAN_SOCKETIO_SERVER_PORT;
    
    try {
      if (window && !port) {
        console.log('window.__suman', util.inspect(window.__suman));
        port = Number(window.__suman.SUMAN_SOCKETIO_SERVER_PORT);
      }
    }
    catch (err) {
    }
    
    if (!port) {
      throw new Error('Suman implementation error, no port specified by "SUMAN_SOCKETIO_SERVER_PORT" env var.');
    }
    
    client = Client(`http://localhost:${port}`);
    
    client.on('connect', function () {
      _suman.log.warning('client connected.');
    });
    
    client.on('event', function (data: string) {
      _suman.log.info('event data => ', data);
    });
    
    client.on('disconnect', function () {
      _suman.log.error('client disconnected.');
    });
    
  }
  
  return client;
  
};



