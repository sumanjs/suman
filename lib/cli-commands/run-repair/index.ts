'use strict';

//typescript
import {ISumanOpts} from "../../dts/global";
import {IMap} from 'suman-utils';
import {ISumanErrorFirstCB} from "../index";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';
import * as EE from 'events';
import * as cp from 'child_process';

//npm
import * as async from 'async';
import su = require('suman-utils');


//project
const _suman = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////

export const run = function (opts: ISumanOpts) {

  const {projectRoot} = _suman;
  const testSrcDir = process.env.TEST_SRC_DIR;

  async.autoInject({

    chmod: function (cb: Function) {

      const filesToFind = ['@run.sh', '@transform.sh', '@target', '@src'];

      su.findSumanMarkers(filesToFind, testSrcDir, [], function (err: Error, map: IMap) {
        const keys = Object.keys(map);
        async.eachLimit(keys, 5, function (k: string, cb: Function) {
          let keys = Object.keys(map[k]);
          async.each(keys, function (key: string, cb: ISumanErrorFirstCB) {
            let fileOrFolder = path.join(k, key);
            _suman.log('Running 777 against this file/folder:', fileOrFolder);
            fs.chmod(fileOrFolder, '511', cb);
          }, cb);
        }, cb);

      });

    },

    postinstall: function(cb: Function){
      process.nextTick(cb);
    }

  }, function (err, results) {

    if(err){
      throw err;
    }

    _suman.log('Results => ', results);

  });

};
