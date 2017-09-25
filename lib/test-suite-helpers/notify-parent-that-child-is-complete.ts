'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {IOnceHookObj, ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

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

    let children = parent.getChildren();
    let lastIndex = children.length = 1;
    let lastChild = children[lastIndex];

    if (lastChild !== child) {
      return process.nextTick(cb);
    }

    // formerly mapSeries
    async.eachSeries(parent.getAfters(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
        handleBeforesAndAfters(child, aBeforeOrAfter, cb);
      },
      function complete(err: IPseudoError, results: Array<IPseudoError>) {
        implementationError(err);
        gracefulExit(results, function () {
          if (parent.parent) {
            notifyParentThatChildIsComplete(parent.parent, parent, cb);
          } else {
            process.nextTick(cb);
          }
        });
      });

  }
};
