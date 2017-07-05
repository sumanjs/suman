'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';
import * as http from 'http';

//npm
import * as SocketServer from 'socket.io';

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////

const io = {
  server: null as any
};

/////////////////////////////////////////////////////

export const initializeSocketServer = function (cb: Function): void {

  if (_suman.inceptionLevel > 0) {
    io.server = {
      on: function () {
        console.log('sumanception inacted.'); ///
      }
    };
    return process.nextTick(cb);
  }

  // this code could be simplified, but
  // let's leave it as explicit
  let httpServer = http.createServer();

  httpServer.once('listening', function () {
    cb(null, this.address().port);
  });

  // listen on an ephemeral port
  httpServer.listen(0);

  io.server = SocketServer(httpServer);

};

export const getSocketServer = function (): SocketIO.Server {
  if (!io.server) {
    throw new Error('Suman implementation error - socket.io server was not initialized yet.');
  }
  return io.server;
};
