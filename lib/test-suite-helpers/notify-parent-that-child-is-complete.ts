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
import {implementationError} from '../helpers/general';

//////////////////////////////////////////////////////////////////////////////////////////

export const makeNotifyParent = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) {

  //////////////////////////////////////////////////////////

  return function notifyParentThatChildIsComplete(child: ITestSuite, cb: Function) {

    const parent = child.parent;

    if (!parent) {
      return process.nextTick(cb);
    }

    if (!child.allChildBlocksCompleted && child.getChildren().length > 0) {
      return process.nextTick(cb);
    }

    if (!parent.completedChildrenMap.get(child)) {
      parent.completedChildrenMap.set(child, true);
      parent.childCompletionCount++;
    }

    if (parent.childCompletionCount === parent.getChildren().length) {
      parent.allChildBlocksCompleted = true;
    }

    if (parent.childCompletionCount > parent.getChildren().length) {
      parent.allChildBlocksCompleted = true;
      _suman.log.warning('Suman implementation warning => parent.childCompletionCount should never be greater than ' +
        'parent.getChildren().length');
    }

    if (!parent.allChildBlocksCompleted) {
      // if parent.childCompletionCount < parent.getChildren().length, then we can't run afters yet.
      return process.nextTick(cb);
    }

    if (parent.alreadyStartedAfterHooks) {
      return process.nextTick(cb);
    }

    parent.afterHooksCallback = function (cb: Function) {

      parent.alreadyStartedAfterHooks = true;

      async.eachSeries(parent.getAfters(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
          handleBeforesAndAfters(child, aBeforeOrAfter, cb);
        },

        function complete(err: IPseudoError) {
          implementationError(err);
          process.nextTick(function () {
            notifyParentThatChildIsComplete(parent, cb);
          });
        });

    };

    if (parent.couldNotRunAfterHooksFirstPass) {
      parent.afterHooksCallback(cb);
    }
    else {
      process.nextTick(cb);
    }

  }
};
