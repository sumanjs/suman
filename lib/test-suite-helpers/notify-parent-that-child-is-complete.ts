'use strict';
import {ISuman} from "../../dts/suman";
import {IOnceHookObj, ITestSuite} from "../../dts/test-suite";
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const implementationError = require('../helpers/implementation-error');

//////////////////////////////////////////////////////////////////////////////////////////

export const makeNotifyParent = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) {

  return function notifyParentThatChildIsComplete(parent: ITestSuite, child: ITestSuite, cb: Function) {

    let lastChild = parent.getChildren()[parent.getChildren().length - 1];

    if (lastChild === child) {
      async.mapSeries(parent.getAfters(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
          handleBeforesAndAfters(child, aBeforeOrAfter, cb);
        },
        function complete(err: IPseudoError, results: Array<IPseudoError>) {
          implementationError(err);
          gracefulExit(results, null, function () {
            if (parent.parent) {
              notifyParentThatChildIsComplete(parent.parent, parent, cb);
            } else {
              process.nextTick(cb);
            }
          });
        });
    }
    else {
      process.nextTick(cb);
    }

  }
};
