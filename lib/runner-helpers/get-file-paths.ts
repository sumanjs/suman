'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import * as chalk from 'chalk';

const includes = require('lodash.includes');
import * as async from 'async';

const debug = require('suman-debug')('s:files');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import su = require('suman-utils');

const {constants} = require('../../config/suman-constants');
const {events} = require('suman-events');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////////////

export interface ISumanFilesDoNotMatch {
  filename: string,
  regexType: string,
  regex: string
}

export interface IGetFilePathObj {
  files: Array<string>,
  nonJSFile: boolean,
  filesThatDidNotMatch: Array<ISumanFilesDoNotMatch>
}

export interface IGetFilePathCB {
  (err: Error | null | undefined, obj: IGetFilePathObj): void
}

///////////////////////////////////////////////////////////////////////////////

export const getFilePaths = function (dirs: Array<string>, cb: IGetFilePathCB) {

  console.log('\n'); // now is about a good time to create a newline in the logs

  const {projectRoot, sumanOpts} = _suman;
  const isForce = sumanOpts.force;
  const isForceMatch = sumanOpts.force_match;

  const matchesAny = _suman.sumanMatchesAny;
  const matchesNone = _suman.sumanMatchesNone;
  const matchesAll = _suman.sumanMatchesAll;

  assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
  assert(Array.isArray(matchesNone), ' => Suman internal error => matchesNone is not defined as array type.');
  assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');

  // push this because we don't ever want to run tests
  // which are located with sumanHelpersDir.
  matchesNone.push(new RegExp(_suman.sumanHelperDirRoot));

  let files: Array<string> = [];
  const filesThatDidNotMatch: Array<ISumanFilesDoNotMatch> = [];
  // as soon as we are told to run a non-JS file, we have to flip the following boolean
  let nonJSFile = false;

  function doesMatchAll(filename: string) {
    if (isForceMatch) {
      return true;
    }
    return matchesAll.every(function (regex: RegExp) {
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

  function doesMatchAny(filename: string) {   // we return true if filename matches any regex
    if (isForceMatch) {
      return true;
    }
    const val = !matchesAny.every(function (regex: RegExp) {
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

  function doesMatchNone(filename: string) { // we return true if filename matches any regex
    if (isForceMatch) {
      return true;
    }
    return matchesNone.every(function (regex: RegExp) {
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

    /*
     NOTE: Count keeps track of depth; 0 is first depth.
     */

    async.eachLimit(dirs, 5, function (dir: string, cb: Function) {

      // important!! we need to resolve *full* path to file before matching against any/call, but for none, we can match against
      // non full/complete file path, think about it, e.g.,
      // foo/node_modules/x/y/z, if node_modules is not matched against, then we can stop before x/y/z

      const _doesMatchNone = doesMatchNone(dir);

      if (!_doesMatchNone) {
        resultBroadcaster.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
        return process.nextTick(cb);
      }

      if (!path.isAbsolute(dir)) {
        dir = path.resolve(process.cwd() + '/' + dir);
      }

      fs.stat(dir, function (err, stats) {

        if (err) {
          // this is probably a symlink, we will just ignore the error and log it
          _suman.logError('SYMLINK?', su.decomposeError(err), su.newLine);
          return cb();
        }

        const countIsGreaterThanMaxDepth = (count > sumanOpts.max_depth);
        const isStartingToBeRecursive = (count > 0 && !sumanOpts.recursive);

        if (stats.isDirectory() && !countIsGreaterThanMaxDepth && !isStartingToBeRecursive) {
          fs.readdir(dir, function (err, items) {
            if (err) {
              console.error('\n', ' ', chalk.bgBlack.yellow(' => Suman presumes you wanted to run tests with/within the ' +
                'following path => '), '\n ', chalk.bgBlack.cyan(' => "' + dir + '" '));
              console.error(' ', chalk.magenta.bold(' => But this file or directory cannot be found.'));
              console.error('\n', chalk.magenta(err.stack || err), '\n\n');
              return cb(err);
            }
            let mappedItems = items.map(i => path.resolve(dir + '/' + i));
            runDirs(mappedItems, ++count, cb);
          });

        }
        else if (stats.isFile()) {

          const _doesMatchAny = doesMatchAny(dir);
          const _doesMatchNone = doesMatchNone(dir);
          const _doesMatchAll = doesMatchAll(dir);

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
            _suman.logWarning(chalk.magenta('warning => \n => The following filepath was requested to be run more' +
              ' than once, Suman will only run files once per run! =>'), '\n', file, '\n\n ' +
              chalk.underline(' => To run files more than once in the same run, use "--allow-duplicate-tests"'), '\n');
          }
          else {
            files.push(file);
          }

          process.nextTick(cb);
        }
        else {
          // console.log(' => File may be a link (symlink), currently not supported by Suman => ', chalk.magenta(dir));
          const msg = [
            '\n',
            ' => Suman message => You may have wanted to run tests in the following path:',
            chalk.cyan(String(dir)),
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

  })(dirs, 0, function (err: Error) {

    if (err) {
      console.error('\n');
      _suman.logError(chalk.red.bold('Error finding runnable paths => \n' + err.stack || err));
      process.nextTick(cb, err);
    }
    else {

      if (sumanOpts.transpile && !sumanOpts.useBabelRegister) {
        files = files.map(function (item) {
          return su.mapToTargetDir(item).targetPath;
        });
      }

      filesThatDidNotMatch.forEach(function (val) {
        console.log('\n');
        _suman.log(chalk.bgBlack.yellow(' A file in a relevant directory ' +
          'did not match your regular expressions => '), '\n', util.inspect(val));
      });

      console.log('\n');
      console.error('\n');

      process.nextTick(cb, undefined, {
        files,
        nonJSFile,
        filesThatDidNotMatch
      });
    }
  });

};

// alias
export const findFilesToRun = getFilePaths;
