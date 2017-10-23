'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

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
      if(window && !port){
        port = Number(window.__suman.SUMAN_SOCKETIO_SERVER_PORT);
      }
    }
    catch(err){}

    if (!port) {
      throw new Error('Suman implementation error, no port specified by "SUMAN_SOCKETIO_SERVER_PORT" env var.');
    }

    // if (!Number.isInteger(port)) {
    //   throw new Error('Suman implementation error, no port specified by "SUMAN_SOCKETIO_SERVER_PORT" env var.');
    // }

    client = Client(`http://localhost:${port}`);

    client.on('connect', function () {
      _suman.logWarning('client connected.');
    });

    client.on('event', function (data: string) {
      _suman.log('event data => ', data);
    });

    client.on('disconnect', function () {
      _suman.logError('client disconnected.');
    });

  }

  return client;

};



