'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import * as net from 'net';
import util = require('util');

//npm
import {Pool} from 'poolio';
import JSONStream = require('JSONStream');


console.log('starting this thing.');

///////////////////////////////////////////////

export const run = function (projectRoot: string, sumanLibRoot: string, cb: Function) {

  if (process.argv.indexOf('--daemon') < 1) {
    console.log('not a daemon process.');
    return process.nextTick(cb);
  }

  if(!process.stdout.isTTY){
    return process.nextTick(cb,'process is not a tty, cannot run suman-daemon.');
  }

  const f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
  try {
    fs.writeFileSync(f, String(process.pid));
  }
  catch (err) {
    return process.nextTick(cb, err);
  }

  console.log('suman daemon loaded.');

  const p = new Pool({
    filePath: path.resolve(__dirname + '/start-script.js'),
    size: 3,
    env: Object.assign({}, process.env, {
      SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
      SUMAN_PROJECT_ROOT: projectRoot
    }),
    streamStdioAfterDelegation: true,
    oneTimeOnly: true,
    inheritStdio: false,
    resolveWhenWorkerExits: true
  });

  p.on('error', function (e: Error) {
    console.error('pool error => ', e.stack || e);
  });

  const s = net.createServer(function(socket){

    console.log('socket connection made.');

    socket.pipe(JSONStream.parse()).on('data', function(obj: Object){

      console.log('message from ',util.inspect(obj));

      // socket.write('pinnochio');
      return p.any(obj, {socket});
    });

  });

  const port = 9091;

  s.once('listening', function(){
     console.log(`suman daemon tcp server listening on port ${port}`);
  });

  s.listen(port);



};

export const run2 = function (projectRoot: string, cb: Function) {

  if (process.argv.indexOf('--daemon') < 1) {
    console.log('no daemon');
    return process.nextTick(cb);
  }

  const f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
  try {
    fs.writeFileSync(f, String(process.pid));
  }
  catch (err) {
    return process.nextTick(cb, err);
  }

  console.log('suman daemon loaded.');

  const p = path.resolve(projectRoot + '/SUMANPIPEIN');

  const fd = fs.openSync(p, fs.constants.O_NONBLOCK | fs.constants.O_RDWR);
  const socket = new net.Socket({fd, readable: true, writable: true});

  socket.on('data', function (d) {

    if (String(d).trim() === '[stdin end]') {
      // done = true;
      console.log('received stdin and stuff.');
      // process.stdin.end();
      return process.nextTick(cb);
    }
    console.log('received command line argument => ', d);
    process.argv.push(String(d).trim());

  });

  const pkg = require('../../../package.json');
  // pre-load all dependencies
  Object.keys(pkg.dependencies).forEach(function (name: string) {

    try {
      require(name);
    }
    catch (err) {
      console.error(err.message);
    }

  });

};

export const run3 = function (projectRoot: string, sumanLibRoot: string, cb: Function) {

  if (process.argv.indexOf('--daemon') < 1) {
    console.log('not a daemon process.');
    return process.nextTick(cb);
  }

  if(!process.stdout.isTTY){
    return process.nextTick(cb,'process is not a tty, cannot run suman-daemon.');
  }

  const f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
  try {
    fs.writeFileSync(f, String(process.pid));
  }
  catch (err) {
    return process.nextTick(cb, err);
  }

  console.log('suman daemon loaded.');

  const p = new Pool({
    filePath: path.resolve(__dirname + '/start-script.js'),
    size: 3,
    env: Object.assign({}, process.env, {
      SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
      SUMAN_PROJECT_ROOT: projectRoot
    }),
    streamStdioAfterDelegation: true,
    oneTimeOnly: true,
    inheritStdio: false,
    resolveWhenWorkerExits: true,
    // getSharedWritableStream: function () {
    //   console.log('getting sumanpipeout...2');
    //   // const fd = fs.openSync(path.resolve(process.env.HOME + '/.suman/SUMANPIPEOUT'),'r+');
    //   // return fs.createWriteStream(null, {fd})
    //   // return fs.createWriteStream(path.resolve(process.env.HOME + '/.suman/SUMANPIPEOUT'));
    //   return fs.createWriteStream(path.resolve(process.env.HOME + '/.suman/somefile.log'));
    // }
  });

  p.on('error', function (e: Error) {
    console.error('pool error => ', e.stack || e);
  });

  console.log('listening for stdin...');

  let rawData: string = '';
  let pid: string = null;
  let file: string = null;

  process.stdin
  .setEncoding('utf8')
  .resume()
  .on('data', function (d: string) {

    console.log(p.getCurrentStats());

    rawData += String(d);

    if (rawData.match('stdin-end')) {

      //match all non-whitespace tokens
      const argz = String(rawData).match(/\S+/g);

      rawData = '';

      // console.log('argz => ', argz);

      const args = argz.filter(function (item) {
        if (item.match('#pid')) {
          pid = item.split('#')[0];
          return false;
        }
        if(item.match('SUMAN_FILE_TO_LOG')){
          file = item.split('#')[0];
          console.log('file in index => ', file);
          return false;
        }
        if(item.match('stdin-end')){
          //
          return false;
        }
        return true;
      });

      return p.any({args, pid}, {file});

    }

  });

};


