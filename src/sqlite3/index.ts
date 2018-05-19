'use strict';

//dts
import {IGlobalSumanObj, ISumanOpts, ISumanConfig} from "suman-types/dts/global";
import {AsyncResultArrayCallback} from 'async';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
const chalk = require('chalk');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
let sql: any, db :any;


//////////////////////////////////////////////////////////////////////////////////////
try {
  sql = require('sqlite3').verbose();
}
catch (err) {
  console.error('\n', err.stack, '\n');
  console.error(chalk.yellow.bold(' => Looks like Suman could not find "sqlite3" NPM dependency.'));
  console.error(' => Suman uses NODE_PATH to source heavier dependencies from a shared location.');
  console.error(' => If you use the suman command, NODE_PATH will be set correctly.');

  if (process.env.NODE_PATH) {
    _suman.log.error('$NODE_PATH currently has this value => ', process.env.NODE_PATH);
  }
  else {
    _suman.log.error('$NODE_PATH is currently ' + chalk.yellow('*not*') + ' defined.');
  }

  _suman.log.error('If for whatever reason you ran node against the suman cli.js file, ' +
    'then NODE_PATH may not be set correctly.');
  _suman.log.error('Try "$ NODE_PATH=$NODE_PATH:~/.suman/global/node_modules node <your-file.js>"');
  _suman.log.error('You may attempt to use the --force flag to overcome this obstacle. But better to resolve the underlying issue.');
}

export const getDatabase = function(dbPath: string, cb?: Function){

   if(!db){
      db = new sql.Database(dbPath, cb);
   }

   return db;

};

export const getRunId = function(dbPath: string, cb: Function){

  let runId : string, db = getDatabase(dbPath);
  db.configure('busyTimeout', 4000);
  db.once('error', cb);

  db.serialize(function () {
    db.run('BEGIN EXCLUSIVE TRANSACTION;');
    db.all('SELECT run_id from suman_run_id', function (err: Error, rows: Array<Object>) {
      if (err) {
        return cb(err);
      }

      db.serialize(function () {

        if (rows.length > 1) {
          _suman.log.error('Suman internal warning => "suman_run_id" rows length is greater than 1.');
        }

        const val = rows[0] ? rows[0].run_id : 1;
        runId = _suman.runId = process.env.SUMAN_RUN_ID = val;
        const updatedValue = val + 1;
        db.run('UPDATE suman_run_id SET run_id = ' + updatedValue);
        db.run('COMMIT TRANSACTION;', function (err: Error) {
          db.close();
          err ? cb(err) : cb(null, runId);
        });
      });

    });
  });

};
