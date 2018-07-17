'use strict';

//dts
import {IGlobalSumanObj, ISumanConfig, ISumanOpts} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import fs = require('fs');
import util = require('util');
import path = require('path');

//npm
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {cpHash, socketHash, ganttHash} from './socket-cp-hash';

//////////////////////////////////////////////////////

export const createGanttChart = function (cb: Function) {
  
  if (!(_suman.sumanConfig && _suman.sumanConfig.viewGantt)) {
    // user does not want to render Gantt chart visualization
    return process.nextTick(cb);
  }
  
  let Handlebars: any;
  
  try {
    Handlebars = require('handlebars');
  }
  catch (err) {
    _suman.log.error(err.message || err);
    return process.nextTick(cb);
  }
  
  let p = path.resolve(__dirname + '/../../assets/gantt/index.html');
  
  fs.readFile(p, function (err, data) {
    
    if (err) {
      _suman.log.error(err.stack || err);
      return cb();
    }
    
    let template = Handlebars.compile(String(data));
    
    const tasks = Object.keys(ganttHash).map(function (k) {
      
      const gd = ganttHash[k];
      
      return {
        startDate: gd.startDate,
        endDate: gd.endDate,
        transformStartDate: gd.transformStartDate,
        transformEndDate: gd.transformEndDate,
        taskName: gd.fullFilePath || gd.shortFilePath,
        status: gd.sumanExitCode > 0 ? 'FAILED' : 'SUCCEEDED'
      };
      
    });
    
    const result = template({
      tasks: JSON.stringify(tasks)
    });
    
    const p = path.resolve(_suman.sumanHelperDirRoot + '/.meta/gantt.html');
    fs.writeFile(p, result, cb);
    
  });
  
};

export const createTimelineChart = function (cb: Function) {
  
  if (!(_suman.sumanConfig && _suman.sumanConfig.viewGantt)) {
    // user does not want to render Gantt chart visualization
    return process.nextTick(cb);
  }
  
  let Handlebars: any;
  
  try {
    Handlebars = require('handlebars');
  }
  catch (err) {
    _suman.log.error(err.message || err);
    return process.nextTick(cb);
  }
  
  let p = path.resolve(__dirname + '/../../assets/gantt/timeline-template.html');
  
  fs.readFile(p, function (err, data) {
    
    if (err) {
      _suman.log.error(err.stack || err);
      return cb();
    }
    
    let template = Handlebars.compile(String(data));
    
    const tasks = Object.keys(ganttHash).map(function (k) {
      
      const gd = ganttHash[k];
      
      return {
        startDate: gd.startDate,
        endDate: gd.endDate,
        transformStartDate: gd.transformStartDate,
        transformEndDate: gd.transformEndDate,
        taskName: gd.shortFilePath || gd.fullFilePath,
        status: gd.sumanExitCode > 0 ? 'FAILED' : 'SUCCEEDED'
      };
      
    });
    
    const result = template({
      tasks: JSON.stringify(tasks.sort(function(a,b){
         return a.startDate - b.startDate;
      }))
    });
    
    const p = path.resolve(_suman.sumanHelperDirRoot + '/.meta/timeline.html');
    fs.writeFile(p, result, cb);
    
  });
  
};



