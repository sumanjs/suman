'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const domain = require('domain');
const assert = require('assert');
const util = require('util');

//npm
const async = require('async');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////////

module.exports = function useContainer(strm, item, cb) {

  //TODO: maybe container does not need to be re-built

  if(item.script){

    var exec = 'bash';

    if(typeof item.script === 'object'){
       exec = item.script.interpreter || exec;
       item.script = item.script.str;
    }

    assert(typeof item.script === 'string',
      ' => suman.group item has script property which does not point to a string => ' + util.inspect(item));

    const n = cp.spawn(exec);

    n.stdin.setEncoding('utf8');
    n.stdin.write('\n' + item.script + '\n');   // <<< key part, you must use newline char

    process.nextTick(function(){
      n.stdin.end();
    });

    n.stdout.setEncoding('utf8');

    n.stdout.pipe(strm);
    n.stderr.pipe(strm);

    n.on('close', function (code) {
      console.log(' => Child process exit code => ', code);
      cb(null,code);
    });

  }
  else if(typeof item.getPathToScript === 'function'){


    const b = item.getPathToScript();
    assert(path.isAbsolute(b), ' => Path to group script must be absolute.');


    console.log(colors.red.bold('path to script => ', b));

    const n = cp.spawn(b, [], {
      // stdio: ['ignore','inherit','inherit']
    });

    const d = domain.create();

    d.on('error', function (err) {
      console.log(' => User script error, in script with path => ', b, '\n', (err.stack || err));
    });

    strm.on('error', function (err) {
      console.log(' => User test script error, in script with path => ', b,
        '\n',
        colors.cyan(' Try running the script directly, if the error is not obvious.'),
        '\n',
        ' => Check the logs at <sumanHelpersDir>/logs/groups',
        '\n',
        colors.magenta(err.stack || err));
    });

    n.stdout.pipe(strm);
    n.stderr.pipe(strm);

    n.on('close', function (code) {
      console.log(' => Child process exit code => ', code);
      cb(null, code);
    });

  }
  else{
    throw new Error(' => Suman usage error => You do not have the necessary properties on your suman.group item.\n' +
      'Please see xxx.');
  }


};
