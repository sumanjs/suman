'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (suman, gracefulExit, handleBeforesAndAfters) {

  return function notifyParentThatChildIsComplete(parentTestId, childTestId, cb) {

    let parent = null;
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
        async.mapSeries(parent.getAfters(), handleBeforesAndAfters, function complete(err, results) {
          gracefulExit(results, null, function () {
            if (parent.parent) {
              notifyParentThatChildIsComplete(parent.parent.testId, parent.testId, cb);
            } else {
              process.nextTick(cb);
            }
          });
        });
      } else {
        process.nextTick(cb);
      }
    }
  }
};
