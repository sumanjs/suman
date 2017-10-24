'use strict';

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
import * as chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {cpHash, socketHash, ganttHash} from './socket-cp-hash';

//////////////////////////////////////////////////////

export const createGanttChart = function (cb: Function) {

  let Handlebars: any;

  try {
    Handlebars = require('handlebars');
  }
  catch (err) {
    _suman.log.error(err.message || err);
    return process.nextTick(cb);
  }

  let p = path.resolve(__dirname + '/../gantt/index.html');

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

    const p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-4.html');
    fs.writeFile(p, result, cb);

  });

};

export const createGanttChart2 = function (cb: Function) {

  let Handlebars: any;

  try {
    Handlebars = require('handlebars');
  }
  catch (err) {
    _suman.log.error(err.message || err);
    return process.nextTick(cb);
  }

  const p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-2.hbs');

  fs.readFile(p, function (err, data) {

    if (err) {
      _suman.log.error(err.stack || err);
      return cb();
    }

    let template = Handlebars.compile(String(data));

    const millisPerDay = 86400000;

    const getAdjustedDate = function (millis: number) {
      return _suman.startDateMillis + (millis - _suman.startDateMillis) * millisPerDay;
    };

    const map = Object.keys(cpHash).map(function (k) {

      const n = cpHash[k];
      const diff = (n.dateEndedMillis - n.dateStartedMillis) * millisPerDay;

      const startDate = getAdjustedDate(n.dateStartedMillis);
      const endDate = getAdjustedDate(n.dateEndedMillis);
      // endDate.setSeconds(startDate.getSeconds() + 1000*diff);

      return [
        String(k),
        n.shortTestPath,
        n.sumanExitCode > 0 ? 'fail-group' : 'success-group',
        startDate,
        endDate,
        null,
        100,
        null
      ]
    });

    const result = template({
      arrayOfArrays: JSON.stringify(map)
    });

    const p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-3.html');
    fs.writeFile(p, result, cb);

  });

};




