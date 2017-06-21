'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const util = require('util');

//npm
const colors = require('colors/safe');
const includes = require('lodash.includes');
const async = require('async');
const debug = require('suman-debug')('s:files');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');
const {constants} = require('../../config/suman-constants');
const {events} = require('suman-events');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////////////

exports.getFilePaths = exports.findFilesToRun = function _getFilePaths(dirs, opts, cb) {

  console.log('\n'); // now is about a good time to create a newline in the logs

  //these are defined at top of ./index.js
  const matchesAny = _suman.sumanMatchesAny;
  const matchesNone = _suman.sumanMatchesNone;
  const matchesAll = _suman.sumanMatchesAll;

  assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
  assert(Array.isArray(matchesNone), ' => Suman internal error => matchesNone is not defined as array type.');
  assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');

  debug(' => all dirs to be processed => ', dirs);

  const {projectRoot, sumanOpts} = _suman;
  const isForce = sumanOpts.force;

  debug([' => Test files will be run if they match any of:', matchesAny], function () {
    return sumanOpts.verbose === true && matchesAny.length > 0;
  });

  debug([' => But test files will *not* run if they match any of:', matchesNone], function () {
    return sumanOpts.verbose === true && matchesNone.length > 0;
  });

  debug([' => Test files will *not* run if they don\'t match all of:', matchesAll], function () {
    return sumanOpts.verbose === true && matchesAll.length > 0;
  });

  let files = [];
  const filesThatDidNotMatch = [];
  // as soon as we are told to run a non-JS file, we have to flip the following boolean
  let nonJSFile = false;

  function doesMatchAll(filename) {
    if(isForce){
      return true;
    }
    return matchesAll.every(function (regex) {
      const val = String(filename).match(regex);
      if (!val) {
        filesThatDidNotMatch.push({
          filename: filename,
          regexType: 'matchAll',
          regex: 'The filename did not match the following regex' +
          ' and therefore was excluded => ' + [regex],
        });
      }
      return val;
    });
  }

  function doesMatchAny(filename) {   // we return true if filename matches any regex
    if(isForce){
      return true;
    }
    const val = !matchesAny.every(function (regex) {
      return !String(filename).match(regex);
    });

    if (!val) {
      filesThatDidNotMatch.push({
        filename: filename,
        regexType: 'matchAny',
        regex: 'The filename did not match any of the following regex(es) => '
        + matchesAny.map(i => i.toString().slice(1, -1))
      });
    }

    return val;
  }

  function doesMatchNone(filename) { // we return true if filename matches any regex
    if(isForce){
      return true;
    }
    return matchesNone.every(function (regex) {
      const val = !String(filename).match(regex);
      if (!val) {
        filesThatDidNotMatch.push({
          filename: filename,
          regexType: 'matchNone',
          regex: 'The filename matched the following regex and was therefore excluded => ' + [regex],

        });
      }
      return val;
    });
  }

  (function runDirs(dirs, count, cb) {

    debug(' => depth => ', count, ' => dirs being processed => ', dirs);

    /*
     NOTE: Count keeps track of depth, 0 is first depth
     */

    async.eachLimit(dirs, 5, function (dir, cb) {

      // important!! we need to resolve *full* path to file before matching against any/call, but for none, we can match against
      // non full/complete file path, think about it, e.g.,
      // foo/node_modules/x/y/z, if node_modules is not matched against, then we can stop before x/y/z

      let isForceMatch = sumanOpts.force_match;
      const _doesMatchNone = isForceMatch || doesMatchNone(dir);

      if (!_doesMatchNone) {
        resultBroadcaster.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
        return process.nextTick(cb);
      }

      fs.stat(dir, function (err, stats) {

        if (err) {
          // this is probably a symlink, we will just ignore the error and log it
          console.error('\n', (err.stack || err), '\n');
          return cb();
        }

        const countIsGreaterThanMaxDepth = (count > opts.max_depth);
        const isStartingToBeRecursive = (count > 0 && !_suman.sumanOpts.recursive);

        if (stats.isDirectory() && !countIsGreaterThanMaxDepth && !isStartingToBeRecursive) {
          fs.readdir(dir, function (err, items) {
            if (err) {
              console.error('\n', ' ', colors.bgBlack.yellow(' => Suman presumes you wanted to run tests with/within the ' +
                'following path => '), '\n ', colors.bgBlack.cyan(' => "' + dir + '" '));
              console.error(' ', colors.magenta.bold(' => But this file or directory cannot be found.'));
              console.error('\n', colors.magenta(err.stack || err), '\n\n');
              return cb(err);
            }
            items = items.map(i => path.resolve(dir + '/' + i));
            runDirs(items, ++count, cb);
          });

        }
        else if (stats.isFile()) {

          let isForceMatch = sumanOpts.force_match;

          const _doesMatchAny = isForceMatch || doesMatchAny(dir);
          const _doesMatchNone = isForceMatch || doesMatchNone(dir);
          const _doesMatchAll = isForceMatch || doesMatchAll(dir);

          if (!_doesMatchAny) {
            resultBroadcaster.emit(String(events.FILENAME_DOES_NOT_MATCH_ANY), dir);
            return process.nextTick(cb);
          }

          if (!_doesMatchNone) {
            resultBroadcaster.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
            return process.nextTick(cb);
          }

          if (!_doesMatchAll) {
            resultBroadcaster.emit(String(events.FILENAME_DOES_NOT_MATCH_ALL), dir);
            return process.nextTick(cb);
          }

          const baseName = path.basename(dir);

          if (path.extname(baseName) !== '.js') {
            nonJSFile = true;
            resultBroadcaster.emit(String(events.FILE_IS_NOT_DOT_JS), dir);
          }

          const file = path.resolve(dir);

          if (!sumanOpts.allow_duplicate_tests && includes(files, file)) {
            console.log(colors.magenta(' => Suman warning => \n => The following filepath was requested to be run more' +
              ' than once, Suman will only run files once per run! =>'), '\n', file, '\n\n ' +
              colors.underline(' => To run files more than once in the same run, use "--allow-duplicate-tests"'),'\n');
          }
          else {
            files.push(file);
          }

          process.nextTick(cb);
        }
        else {
          // console.log(' => File may be a link (symlink), currently not supported by Suman => ', colors.magenta(dir));
          const msg = [
            '\n',
            ' => Suman message => You may have wanted to run tests in the following path:',
            colors.cyan(String(dir)),
            '...but it is either a folder or is not a .js (or accepted file type) file, or it\'s a symlink',
            'if you want to run *subfolders* you shoud use the recursive option -r',
            '...be sure to only run files that constitute Suman tests, to enforce this we',
            'recommend a naming convention to use with Suman tests, see: sumanjs.org\n\n'
          ].filter(i => i).join('\n');

          resultBroadcaster.emit(String(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE), msg);
          process.nextTick(cb);
        }

      });

    }, cb);

  })(dirs, 0, function (err) {

    if (err) {
      console.error('\n');
      _suman.logError(colors.red.bold('Error finding runnable paths => \n' + err.stack || err));
      process.nextTick(cb, err);
    }
    else {

      if (opts.transpile && !opts.useBabelRegister) {
        files = files.map(function (item) {
          return su.mapToTargetDir(item).targetPath;
        });
      }

      process.nextTick(function () {
        cb(undefined, {
          files: files,
          nonJSFile: nonJSFile,
          filesThatDidNotMatch: filesThatDidNotMatch
        });
      });
    }
  });

};
