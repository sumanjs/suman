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

export const areAllChildBlocksCompleted = function (block: ITestSuite): boolean {

  if (block.allChildBlocksCompleted) {
    return true;
  }

  const children = block.getChildren();
  for (let i = 0; i < children.length; i++) {
    if (!children[i].allChildBlocksCompleted) {
      return false;
    }
  }

  return block.allChildBlocksCompleted = true;

};

export const makeNotifyParent = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) {

  return function notifyParentThatChildIsComplete(parent: ITestSuite, child: ITestSuite, cb: Function) {

    // let children = parent.getChildren();
    // let lastIndex = children.length - 1;
    // let lastChild = children[lastIndex];
    //
    // if (lastChild !== child) {
    //   //TODO: this is incorrect, need to fix
    //   return process.nextTick(cb);
    // }

    if(!parent.allChildBlocksCompleted){
      // allChildBlocksCompleted is an integer that gets incremeted as each child completes
      // if parent.childCompletionCount < parent.getChildren().length, then we can't run afters yet.
      return process.nextTick(cb);
    }

    // formerly mapSeries
    async.mapSeries(parent.getAfters(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
        handleBeforesAndAfters(child, aBeforeOrAfter, cb);
      },

      function complete(err: IPseudoError, results: Array<IPseudoError>) {

        implementationError(err);

        gracefulExit(results, function () {
          if (parent.parent) {
            notifyParentThatChildIsComplete(parent.parent, parent, cb);
          }
          else {
            process.nextTick(cb);
          }
        });
      });

  }
};
