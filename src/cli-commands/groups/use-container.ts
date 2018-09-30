'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');
import {Writable} from "stream";


//npm
import * as su from 'suman-utils';
import chalk from 'chalk';
import async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});
const debug = require('suman-debug')('s:groups');

////////////////////////////////////////////////////////////////////////////

export const runUseContainer = function (strm: Writable, item: any, cb: Function) {

  const {projectRoot, sumanOpts} = _suman;

  async.waterfall([

    function getExistingImage(cb: Function) {

      const race = su.once(this,cb);

      setTimeout(function () {

        race(null, {
          name: item.name,
          isContainerAlreadyBuilt: null,
          containerInfo: null
        });

      }, 3000);

      if (!item.allowReuseImage) {
        process.nextTick(function () {
          race(null, {
            name: item.name,
            isContainerAlreadyBuilt: null,
            containerInfo: null
          });
        });
      }
      else {

        let n = cp.spawn('bash', [], {
          cwd: item.cwd || process.cwd()
        });

        n.stdin.setEncoding('utf8');
        n.stderr.setEncoding('utf8');
        n.stdout.setEncoding('utf8');

        // <<< key part, you must use newline char
        n.stdin.write('\n' + 'docker images -q ' + item.name + '  2> /dev/null' + '\n');

        process.nextTick(function () {
          n.stdin.end();
        });

        let data = '';

        n.stdout.on('data', function (d) {
          data += String(d);
        });

        if (!sumanOpts.no_stream_to_console) {
          n.stdout.pipe(process.stdout, {end: false});
          n.stderr.pipe(process.stderr, {end: false});
        }

        if (!sumanOpts.no_stream_to_file) {
          n.stdout.pipe(strm, {end: false});
          n.stderr.pipe(strm, {end: false});
        }

        n.once('close', function (code) {
          n.unref();
          console.log('EXIT CODE FOR FINDING EXISTING CONTAINER => ', code);
          race(null, {
            name: item.name,
            isContainerAlreadyBuilt: !!data,
            containerInfo: data
          });
        });

      }

    },

    function buildContainer(data, cb) {

      debug(' => data from check existing container => ', item);

      let name = data.name;

      if (data.isContainerAlreadyBuilt) {
        // this means our image has already been built
        debug(' => Container is already built => ', data);
        process.nextTick(function () {
          cb(null, {
            name: name,
            code: 0
          });
        });
      }
      else {

        debug(' => Container is *not* already built....building...');
        const b = item.build();

        console.log(' => "Build" container command => ', '"' + b + '"');
        //TODO: need to check if bash is the right interpreter
        let n = cp.spawn('bash', [], {
          cwd: item.cwd || process.cwd()
        });

        n.stdin.setEncoding('utf8');
        n.stderr.setEncoding('utf8');
        n.stdout.setEncoding('utf8');

        n.stdin.write('\n' + b + '\n');   // <<< key part, you must use newline char

        process.nextTick(function () {
          n.stdin.end();
        });

        if (!sumanOpts.no_stream_to_console) {
          n.stdout.pipe(process.stdout, {end: false});
          n.stderr.pipe(process.stderr, {end: false});
        }

        if (!sumanOpts.no_stream_to_file) {
          n.stdout.pipe(strm, {end: false});
          n.stderr.pipe(strm, {end: false});
        }

        n.once('close', function (code) {
          n.unref();
          console.log('EXIT CODE OF CONTAINER BUILD => ', code);
          cb(null, {
            name: name,
            code: code
          });
        });

      }
    },

    function runContainer(data, cb: Function) {

      let code = data.code;
      let name = data.name;

      if (code > 0) {
        console.error('\n', chalk.red.bold(' => Exit code of container build command was greater than zero, ' +
          'so we are not running the container.'), '\n');
        return process.nextTick(function () {
          cb(null, {
            code: code,
            name: name
          });
        });
      }

      const r = item.run();
      debug(' => Run container command ', '"' + r + '"');

      let n = cp.spawn('bash', [], {
        cwd: item.cwd || process.cwd()
      });

      n.stdin.setEncoding('utf8');
      n.stdout.setEncoding('utf8');
      n.stderr.setEncoding('utf8');

      n.stdin.write('\n' + r + '\n');   // <<< key part, you must use newline char

      process.nextTick(function () {
        n.stdin.end();
      });

      if (!sumanOpts.no_stream_to_console) {
        n.stdout.pipe(process.stdout, {end: false});
        n.stderr.pipe(process.stderr, {end: false});
      }

      if (!sumanOpts.no_stream_to_file) {
        n.stdout.pipe(strm, {end: false});
        n.stderr.pipe(strm, {end: false});
      }

      n.once('close', function (code) {
        n.unref();
        console.log('EXIT CODE OF CONTAINER RUN => ', code);
        cb(null, {
          code: code,
          name: name
        });
      });
    }

  ], cb);

};
