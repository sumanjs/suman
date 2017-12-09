'use strict';

//dts
import {IGlobalSumanObj, ISumanOpts} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";
import {IRunnerRunFn, ISumanChildProcess, IRunnerObj} from "suman-types/dts/runner";
import {AsyncQueue} from "async";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');
import cp = require('child_process');
import fs = require('fs');
import EE = require('events');

//npm
import async = require('async');
import chalk = require('chalk');
import semver = require('semver');
import su = require('suman-utils');
import {events} from 'suman-events';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeHandleDifferentExecutables = function (projectRoot: string, sumanOpts: ISumanOpts,
                                                        runnerObj: IRunnerObj) {
  
  const execFile = path.resolve(__dirname + '/../run-child.js');
  const istanbulExecPath = _suman.istanbulExecPath || 'istanbul';
  
  const isExe = (stats: fs.Stats) => {
    
    // find out if file is executable by current user
    if (process.platform === 'win32') {
      return true;
    }
    
    const {mode, gid, uid} = stats;
    
    const isGroup = gid ? process.getgid && gid === process.getgid() : true;
    const isUser = uid ? process.getuid && uid === process.getuid() : true;
    
    return Boolean((mode & parseInt('0001', 8)) ||
      ((mode & parseInt('0010', 8)) && isGroup) ||
      ((mode & parseInt('0100', 8)) && isUser));
  };
  
  return {
    
    handleRunDotShFile: function (sh: string, argz: Array<string>, cpOptions: Object, cb: Function) {
      
      _suman.log.info(
        chalk.bgWhite.underline.black.bold('Suman has found a @run.sh file => '),
        chalk.bold(sh)
      );
      
      //force to project root
      cpOptions.cwd = projectRoot;
      
      fs.chmod(sh, 0o777, function (err) {
        
        if (err) {
          return cb(err);
        }
        
        if (sumanOpts.coverage) {
          //TODO: we can pass an env to tell suman where to put the coverage data
          _suman.log.warning(chalk.yellow('coverage option was set to true, but we are running your tests via @run.sh.'));
          _suman.log.warning(chalk.yellow('so in this case, you will need to run your coverage call via @run.sh.'));
        }
        
        const n = cp.spawn(sh, argz, cpOptions) as ISumanChildProcess;
        
        cb(null, n);
        
      });
      
    },
    
    handleRegularFile: function (file: string, shortFile: string, argz: Array<string>, cpOptions: Object, cb: Function) {
      
      const extname = path.extname(file);
      
      // open file for reading only
      fs.open(file, 'r', function (err, fd) {
        
        if (err) {
          return cb(err);
        }
        
        const b = Buffer.alloc(184); // 144 is a magic number
        
        // we want to find out if this file has a hashbang => #!/usr/bin/env node
        fs.read(fd, b, 0, 184, 0, function (err, bytesRead, buf) {
          
          if (err) {
            return cb(err);
          }
          
          fs.stat(file, function (err, stats) {
            
            if (err) {
              return cb(err);
            }
            
            const isExecutable = isExe(stats);
            
            let n: ISumanChildProcess,
              hasHasbang = String(buf).startsWith('#!'),
              firstLine = String(String(buf).split('\n')[0]).trim(),
              hashbangIsNode = hasHasbang && firstLine.match(/node$/);
            
            if (!hasHasbang) {
              _suman.log.warning();
              _suman.log.warning('The following file is missing a hashbang.');
              _suman.log.warning(file);
              console.error();
            }
            
            if (extname === '.js') {
              
              if (hasHasbang && !hashbangIsNode) {
                _suman.log.warning('The following test file with a ".js" extension has a hashbang which is not "node".');
                _suman.log.warning('Hashbang: ', chalk.bold.black(firstLine));
                _suman.log.warning('File:', file);
              }
              
              if (sumanOpts.coverage) {
                
                let coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                let argzz = ['cover', execFile, '--dir', coverageDir, '--'].concat(argz);
                
                //'--include-all-sources'
                n = cp.spawn(istanbulExecPath, argzz, cpOptions) as ISumanChildProcess;
                
              }
              else if (hasHasbang && !hashbangIsNode) {
                _suman.log.warning();
                _suman.log.warning('The following file has a ".js" extension but appears to have a hashbang which is not the node executable:');
                _suman.log.warning('Hashbang: ', firstLine);
                _suman.log.warning('File:', file);
                
                // .sh .bash .py, perl, ruby, etc
                _suman.log.info();
                _suman.log.info(`perl bash python or ruby file? '${chalk.magenta(file)}'`);
                
                let onSpawnError = function (err: Error) {
                  if (err && String(err.message).match(/EACCES/i)) {
                    _suman.log.warning();
                    _suman.log.warning(`Test file with the following path may not be executable, or does not have the right permissions:`);
                    _suman.log.warning(chalk.magenta(file));
                    _suman.log.warning(chalk.gray('fs.Stats for this file were:'), util.inspect(stats));
                  }
                  else if (err) {
                    _suman.log.error(err.message || err);
                  }
                };
                
                if (!isExecutable) {
                  _suman.log.error('not executable: ', file);
                }
                
                try {
                  n = cp.spawn(file, argz, cpOptions) as ISumanChildProcess;
                  n.usingHashbang = true;
                }
                catch (err) {
                  onSpawnError(err);
                  return cb(err, n);
                }
                
                if (!isExecutable) {
                  n.once('error', onSpawnError);
                }
                
              }
              else {
                
                // run directly with node executable!
                const execArgz = ['--expose-gc'];
                
                if (sumanOpts.debug_child) {
                  execArgz.push('--debug=' + (5303 + runnerObj.processId++));
                  execArgz.push('--debug-brk');
                }
                
                if (sumanOpts.inspect_child) {
                  if (semver.gt(process.version, '7.8.0')) {
                    execArgz.push('--inspect-brk=' + (5303 + runnerObj.processId++));
                  }
                  else {
                    execArgz.push('--inspect=' + (5303 + runnerObj.processId++));
                    execArgz.push('--debug-brk');
                  }
                }
                
                let execArgs;
                
                if (execArgs = sumanOpts.exec_arg) {
                  execArgs.forEach(function (v: string) {
                    v && execArgz.push(String(v).trim());
                  });
                  
                  String(execArgs).split(/S+/).forEach(function (n) {
                    n && execArgz.push('--' + String(n).trim());
                  });
                }
                
                const $execArgz = execArgz.filter(function (e, i) {
                  // filter out duplicate command line args
                  if (execArgz.indexOf(e) !== i) {
                    _suman.log.error(chalk.yellow(' => Warning you have duplicate items in your exec args => '),
                      '\n' + util.inspect(execArgz), '\n');
                  }
                  return true;
                });
                
                argz.unshift(execFile);
                let argzz = $execArgz.concat(argz); // append exec args to beginning
                n = cp.spawn('node', argzz, cpOptions) as ISumanChildProcess;
              }
              
            }
            else {
              
              let onSpawnError = function (err: Error) {
                if (err && String(err.message).match(/EACCES/i)) {
                  _suman.log.warning();
                  _suman.log.warning(`Test file with the following path may not be executable, or does not have the right permissions:`);
                  _suman.log.warning(chalk.magenta(file));
                  _suman.log.warning(chalk.gray('fs.Stats for this file were:'), util.inspect(stats));
                }
                else if (err) {
                  _suman.log.error(err.message || err);
                }
              };
              
              // .sh .bash .py, perl, ruby, etc
              _suman.log.info();
              _suman.log.info(`perl bash python or ruby file? '${chalk.magenta(file)}'`);
              
              try {
                n = cp.spawn(file, argz, cpOptions) as ISumanChildProcess;
                n.usingHashbang = true;
              }
              catch (err) {
                onSpawnError(err);
                return cb(err, n);
              }
              
              if (!isExecutable) {
                n.once('error', function () {
                  _suman.log.warning(`Test file with the following path may not be executable:`);
                  _suman.log.warning(chalk.magenta(file));
                  _suman.log.warning('fs.Stats for this file were:\n', util.inspect(stats));
                });
              }
            }
            
            cb(null, n);
            
          });
        });
        
      });
      
    }
    
  }
  
};


