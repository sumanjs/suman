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
import chalk from 'chalk';
import semver = require('semver');
import su = require('suman-utils');
import {events} from 'suman-events';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeHandleDifferentExecutables = function (projectRoot: string, sumanOpts: ISumanOpts,
                                                        runnerObj: IRunnerObj) {
  
  const execFile = path.resolve(__dirname + '/../run-child.js');
  const istanbulExecPath =  'istanbul' || 'nyc' || _suman.istanbulExecPath || 'istanbul';
  
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
    
    handleRunDotShFile: function (sh: string, argz: Array<string>, file: string,
                                  shortFile: string, cpOptions: Object, cb: Function) {

       console.log(); // add a new line
      _suman.log.info(
        chalk.bgWhite.underline.black.bold('Suman has found a @run.sh file =>'),
        chalk.bold(sh)
      );
      
      debugger;
      
      //force to project root
      cpOptions.cwd = projectRoot;
      
      fs.chmod(sh, 0o777, function (err) {
        
        if (err) {
          return cb(err);
        }
        
        let sourceMarkerDir = null;
        let targetMarkerDir = null;
        let start = String(path.resolve(file)).split(path.sep);
        let targetTestPath = String(path.resolve(file)).replace(/@src/g, '@target');
        
        if (!sumanOpts.allow_in_place && targetTestPath === file) {
          throw new Error([
            'target test path did not resolve to a different directory than the source path.',
            'to override this warning, use the "--allow-in-place" flag, useful for using babel or ts-node, etc.'
          ].join('\n'));
        }
        
        while (start.length > 0) {
          let last = start.pop();
          if (last === '@src') {
            sourceMarkerDir = path.resolve(start.concat('@src').join(path.sep));
            targetMarkerDir = path.resolve(start.concat('@target').join(path.sep));
            break;
          }
        }
        
        if (!sumanOpts.allow_in_place && !sourceMarkerDir) {
          throw new Error('No source marker dir could be found given the test path => ' + file);
        }
        
        if (!sumanOpts.allow_in_place && !targetMarkerDir) {
          throw new Error('No target marker dir could be found given the test path => ' + file);
        }
        
        let coverageDir = path.resolve(_suman.projectRoot + '/coverage/suman_by_timestamp/' + _suman.timestamp +
          '/suman_by_process/' + String(shortFile).replace(/\//g, '-'));
        
        if (sumanOpts.coverage) {
          //TODO: we can pass an env to tell suman where to put the coverage data
          _suman.log.warning(chalk.yellow('coverage option was set to true, but we are running your tests via @run.sh.'));
          _suman.log.warning(chalk.yellow('so in this case, you will need to run your coverage call via @run.sh.'));
          
          Object.assign(cpOptions.env, {
            SUMAN_COVERAGE_DIR: coverageDir,
            SUMAN_SRC_DIR: sourceMarkerDir,
            SUMAN_TARGET_DIR: targetMarkerDir,
            SUMAN_TARGET_TEST_PATH: targetTestPath
          });
        }
        
        const n = cp.spawn('bash', [], cpOptions) as ISumanChildProcess;
        n.stdin.end(`\n${sh} ${argz.join(' ')};\n`);
        cb(null, n);
        
      });
      
    },
    
    handleRegularFile: function (file: string, shortFile: string, argz: Array<string>, cpOptions: Object, cb: Function) {
      
      debugger;
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
                
                let coverageDir = path.resolve(_suman.projectRoot + '/coverage/suman_by_timestamp/' + _suman.timestamp +
                  '/suman_by_process/' + String(shortFile).replace(/\//g, '-'));
                
                let argzz = ['cover', execFile, '--report=lcov', '--dir', coverageDir, '--'].concat(argz);
                
                //'--include-all-sources'
                // n = cp.spawn(istanbulExecPath, argzz, cpOptions) as ISumanChildProcess;
                n = cp.spawn('bash', [], cpOptions) as ISumanChildProcess;
                process.nextTick(function () {
                  n.stdin.write([istanbulExecPath].concat(argzz).join(' '));
                  n.stdin.end('\n');
                });
                
              }
              else if (hasHasbang && !hashbangIsNode) {
                
                _suman.log.warning();
                _suman.log.warning('The following file has a ".js" extension but appears to have a hashbang which is not the node executable:');
                _suman.log.warning('Hashbang: ', firstLine);
                _suman.log.warning('File:', file);
                
                // .sh .bash .py, perl, ruby, etc
                _suman.log.info();
                _suman.log.info(`perl bash python or ruby file? '${chalk.magenta(file)}'`);
                
                if (!isExecutable) {
                  console.error('\n');
                  _suman.log.warning(`Warning: test file with the following path may not be executable:`);
                  _suman.log.warning(chalk.magenta(file));
                  su.vgt(6) && _suman.log.warning('fs.Stats for this file were:\n', util.inspect(stats));
                  console.error();
                }
                
                n = cp.spawn('bash', [], cpOptions) as ISumanChildProcess;
                n.usingHashbang = true;
                process.nextTick(function () {
                  n.stdin.write(`${file} ${argz.join(' ')};`);
                  n.stdin.end(`\n`);
                });
                
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
                
                n = cp.spawn('bash', [], cpOptions)as ISumanChildProcess;
                process.nextTick(function () {
                  n.stdin.write(`node ${argzz.join(' ')};`);
                  n.stdin.end('\n');
                });
              }
              
            }
            else {
              
              if (!isExecutable) {
                console.error('\n');
                _suman.log.warning(`Warning: Test file with the following path may not be executable:`);
                _suman.log.warning(chalk.magenta(file));
                su.vgt(6) && _suman.log.warning('fs.Stats for this file were:\n', util.inspect(stats));
                console.error();
              }
              
              // .sh .bash .py, perl, ruby, etc
              if (su.vgt(5)) {
                _suman.log.info();
                _suman.log.info(`perl bash python or ruby file? '${chalk.magenta(file)}'`);
              }
              
              // n = cp.spawn(file, argz, cpOptions) as ISumanChildProcess;
              n = cp.spawn('bash', [], cpOptions) as ISumanChildProcess;
              n.usingHashbang = true;
              process.nextTick(function(){
                n.stdin.write(`${file} ${argz.join(' ')};`);
                n.stdin.end(`\n`);
              });
              
            }
            
            cb(null, n);
            
          });
        });
        
      });
      
    }
    
  }
  
};


