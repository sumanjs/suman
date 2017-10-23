'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import http = require('http');
import qs  = require('querystring');
import fs = require('fs');
import url = require('url');
import path = require('path');

//npm
import * as SocketServer from 'socket.io';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

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
    // pass -1 as port number
    return process.nextTick(cb, null, -1);
  }

  // this code could be simplified, but
  // let's leave it as explicit
  let httpServer = http.createServer(function (req, res) {
    const {query} = url.parse(req.url, true);

    let data;
    try {
      data = JSON.parse(query.data);
    }
    catch (err) {

      const file = path.resolve(_suman.projectRoot + '/' + req.url);
      const strm = fs.createReadStream(file);

      let onError = function (e: Error) {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end(JSON.stringify({error: e.stack || e}));
        }
      };

      strm.once('error', onError);
      return strm.pipe(res).once('error', onError);

    }

    if (data.path) {
      fs.createReadStream(data.path).pipe(res);
    }
    else {
      res.statusCode = 500;
      res.end(JSON.stringify({error: 'no path or bundle.'}))
    }

  });

  httpServer.once('listening', function () {
    cb(null, this.address().port);
  });

  // listen on an ephemeral port
  httpServer.listen(0);

  io.server = SocketServer(httpServer);

};

export const getSocketServer = function (): SocketIO.Server {
  if (!io.server) throw new Error('Suman implementation error - socket.io server was not initialized yet.');
  return io.server;
};
