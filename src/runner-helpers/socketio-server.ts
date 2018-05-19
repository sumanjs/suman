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
import replaceStream = require('replacestream');
import su  = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////

const io = {
  server: null as any
};

/////////////////////////////////////////////////////

const getEmbeddedScript = function (port: number, id: number) {
  
  const sumanOptsStr = su.customStringify(_suman.sumanOpts);
  const sumanConfigStr = su.customStringify(_suman.sumanConfig);
  const timestamp = Date.now();
  
  return [
    '<script>',
    `window.__suman = window.__suman || {};`,
    // `window.Debugger.enable();`,
    `window.__suman.SUMAN_SOCKETIO_SERVER_PORT=${port};`,
    `window.__suman.SUMAN_CHILD_ID=${id};`,
    `window.__suman.usingRunner=true;`,
    `window.__suman.timestamp=${timestamp};`,
    `window.__suman.sumanConfig=${sumanConfigStr};`,
    `window.__suman.sumanOpts=${sumanOptsStr};`,
    '</script>'
  ]
  .join('\n');
  
};

export const initializeSocketServer = function (cb: Function): void {
  
  if (_suman.inceptionLevel > 0) {
    io.server = {
      on: function () {
        _suman.log.warning('sumanception inacted.'); ///
      }
    };
    // pass -1 as port number
    return process.nextTick(cb, null, -1);
  }
  
  let sb: any, getBrowserStream: Function;
  
  try {
    sb = require('suman-browser');
    getBrowserStream = sb.makeGetBrowserStream(_suman.sumanHelperDirRoot, _suman.sumanConfig, _suman.sumanOpts);
  }
  catch (err) {
    
    if (_suman.sumanOpts.browser) {
      throw new Error('Please install "suman-browser" using "npm install -D suman-browser".');
    }
    else {
      _suman.log.warning('warning: cannot find browser dependency => ', err.message);
    }
  }
  
  const regex = /<suman-test-content>.*<\/suman-test-content>/;
  
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
    
    if (data.path && data.childId) {
      
      let port = httpServer.address().port;
      fs.createReadStream(data.path)
      .pipe(replaceStream(regex, getEmbeddedScript(port, data.childId)))
      .pipe(res);
    }
    else if (data.childId) {
      
      let port = httpServer.address().port;
      let id = data.childId;
      
      getBrowserStream(port, id, function (err: Error, results: Array<string>) {
        if (err) {
          return res.end(JSON.stringify({error: err.stack || err}));
        }
        
        results.forEach(res.write.bind(res));
        res.end();
      });
      
    }
    else {
      res.statusCode = 500;
      res.end(JSON.stringify({error: 'missing path or childId.'}))
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
