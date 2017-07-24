'use strict';

import {IGlobalSumanObj, ISumanConfig, ISumanOpts} from "../../dts/global";

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
import {cpHash, socketHash} from './socket-cp-hash';

//////////////////////////////////////////////////////

export const createGanttChartOld = function (cb: Function) {

  let gantt, vds;

  try {
    vds = require('virtual-dom-stringify');
    gantt = require('gantt-chart');
  }
  catch (err) {
    _suman.logError(err.message || err);
    return process.nextTick(cb);
  }

  var g = gantt({
    "wow": {
      "dependencies": ["amaze"],
      "duration": "1 week"
    },
    "amaze": {
      "duration": "3 days"
    },
    "cool": {
      "duration": "6 days"
    },
    "whatever": {
      "duration": "1 day",
      "dependencies": ["wow"]
    },
    "very": {
      "duration": "2 days",
      "dependencies": ["amaze"]
    },
    "great": {
      "duration": "8 days",
      "dependencies": ["very"]
    }
  });

  const p = path.resolve(_suman.sumanHelperDirRoot + '/gantt.html');
  fs.writeFile(p, vds(g.tree()), cb);
};

export const createGanttChart = function (cb: Function) {

  let Handlebars: any;

  try {
    Handlebars = require('handlebars');
  }
  catch (err) {
    _suman.logError(err.message || err);
    return process.nextTick(cb);
  }

  const p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-2.hbs');

  fs.readFile(p, function(err, data){

    if(err){
      _suman.logError(err.stack || err);
      return cb();
    }

    var template = Handlebars.compile(String(data));

    let getAdjustedDate2 = function(millis){

      console.log('millis => ', millis);
      let a = String(millis).slice(0,-3);
      console.log('a => ', a);

      let b = String(millis).slice(-3);
      console.log('b => ', b);
      let before = Number(a + '000');

      const addThis = Number(b) * 1000;
      console.log('addThis => ', addThis);

      console.log('before => ', before);

      console.log('after => ', before + addThis);
       return before + addThis;
    };

    const millisPerDay = 86400000;

    const getAdjustedDate = function(millis){
       return _suman.startDateMillis + (millis - _suman.startDateMillis)*millisPerDay;
    };


    const map = Object.keys(cpHash).map(function(k){

      const n = cpHash[k];
      const diff = (n.dateEndedMillis - n.dateStartedMillis)*millisPerDay;

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




