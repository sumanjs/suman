'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import * as Client from 'socket.io-client';


//project
let client : SocketIOClient.Socket = null;

////////////////////////////////////////////////////////////////

export const getClient = function () {

  if (!client) {

    client = Client(`http://localhost:${process.env.SUMAN_SOCKETIO_SERVER_PORT}`);
    client.on('connect', function () {
      console.log('client connected.');
    });
    client.on('event', function (data: string) {
      console.log('event data => ', data);
    });
    client.on('disconnect', function () {
      console.log('client disconnected.');
    });

  }

  return client;

};



