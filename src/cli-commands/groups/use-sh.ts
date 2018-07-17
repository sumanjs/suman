'use strict';

//typescript
import {IGlobalSumanObj} from "suman-types/dts/global";
import {Writable} from "stream";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import domain = require('domain');
import assert = require('assert');
import EE = require('events');

//npm
import async = require('async');
import chalk from 'chalk';

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////

export const runUseSh = function (strm: Writable, item, cb: Function) {

  //TODO: maybe container does not need to be re-built

  const {projectRoot, sumanOpts} = _suman;

  if(item.script){

    //TODO: could use execSync to find $SHELL, like so cp.execSync('echo $SHELL');

    let exec = 'bash';
    if(typeof item.script === 'object'){
       exec = item.script.interpreter || exec;
       item.script = item.script.str;
    }

    assert(typeof item.script === 'string',
      ' => suman.group item has script property which does not point to a string => ' + util.inspect(item));

    let n = cp.spawn(exec, [],{
      cwd: item.cwd || process.cwd()
    });

    n.stdin.setEncoding('utf8');
    n.stderr.setEncoding('utf8');
    n.stdout.setEncoding('utf8');

    n.stdin.write('\n' + item.script + '\n');   // <<< key part, you must use newline char

    process.nextTick(function(){
      n.stdin.end();
    });

    if(!sumanOpts.no_stream_to_console){
      n.stdout.pipe(process.stdout, {end: false});
      n.stderr.pipe(process.stderr, {end: false});
    }

    if(!sumanOpts.no_stream_to_file){
      n.stdout.pipe(strm, {end: false});
      n.stderr.pipe(strm, {end: false});
    }


    n.on('close', function (code) {
      cb(null,{
        code: code,
        name: item.name
      });
    });

  }
  else if(typeof item.getPathToScript === 'function'){

    const b = item.getPathToScript();
    assert(path.isAbsolute(b), ' => Path to group script must be absolute.');


    console.log(chalk.red.bold('path to script => ', b));

    let n = cp.spawn(b, [], {
      // stdio: ['ignore','inherit','inherit']
      cwd: item.cwd || process.cwd()
    });


    n.stdin.setEncoding('utf8');
    n.stderr.setEncoding('utf8');
    n.stdout.setEncoding('utf8');

    if(!sumanOpts.no_stream_to_console){
      n.stdout.pipe(process.stdout, {end: false});
      n.stderr.pipe(process.stderr, {end: false});
    }

    if(!sumanOpts.no_stream_to_file){
      n.stdout.pipe(strm, {end: false});
      n.stderr.pipe(strm, {end: false});
    }


    n.on('close', function (code: number) {
      cb(null, {
         code: code,
         name: item.name
      });
    });

  }
  else{
    throw new Error(' => Suman usage error => You do not have the necessary properties on your suman.group item.\n' +
      'Please see xxx.');
  }


};
