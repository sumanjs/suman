'use strict';
import {ISuman} from "../../dts/suman";
import {ITestSuite} from "../../dts/test-suite";
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const implementationError = require('../helpers/implementation-error');

//////////////////////////////////////////////////////////////////////////////////////////

export const makeNotifyParent = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) {

  return function notifyParentThatChildIsComplete(parentTestId: number, childTestId: number, cb: Function) {

    let parent: ITestSuite = null;
    const allDescribeBlocks = suman.allDescribeBlocks;

    for (let i = 0; i < allDescribeBlocks.length; i++) {
      let temp = allDescribeBlocks[i];
      if (temp.testId === parentTestId) {
        parent = temp;
        break;
      }
    }

    if (!parent) { //note: root suite has no parent
      throw new Error(' => Suman implementation error => No parent defined for child, this should not happen.');
    }
    else {
      let lastChild = parent.getChildren()[parent.getChildren().length - 1];
      if (lastChild.testId === childTestId) {
        async.mapSeries(parent.getAfters(), handleBeforesAndAfters,
          function complete(err: IPseudoError, results: Array<IPseudoError>) {
            implementationError(err);
            gracefulExit(results, null, function () {
              if (parent.parent) {
                notifyParentThatChildIsComplete(parent.parent.testId, parent.testId, cb);
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
  }
};

///////////// support node style imports //////////////////////////////////////////////////

let $exports = module.exports;
export default $exports;

//////////////////////////////////////////////////////////////////////////////////////////
