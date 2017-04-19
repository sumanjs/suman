'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const _ = require('underscore');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////

export = function (suman: ISuman, allDescribeBlocks: Array<ITestSuite>) {

  function getAllBeforesEaches(zuite: ITestSuite) {

    const beforeEaches: Array<Array<IBeforeEachObj>> = [];
    beforeEaches.unshift(zuite.getBeforeEaches());

    function getParentBefores(testId: number) {

      let parent = null;

      for (let i = 0; i < allDescribeBlocks.length; i++) {
        let temp = allDescribeBlocks[i];
        if (temp.testId === testId) {
          parent = temp;
          break;
        }
      }

      if (parent) {
        beforeEaches.unshift(parent.getBeforeEaches());
        if (parent.parent) {
          getParentBefores(parent.parent.testId);
        }
      }
      else {
        throw new Error(' => Suman implementation error => this should not happen...please report.');
      }

    }

    if (zuite.parent) {
      getParentBefores(zuite.parent.testId);
    }

    return _.flatten(beforeEaches, true);
  }

  function getAllAfterEaches(zuite: ITestSuite) {

    const afterEaches: Array<Array<IAFterEachObj>> = [];
    afterEaches.push(zuite.getAfterEaches());

    function getParentAfters(testId: number) {

      let parent = null;

      for (let i = 0; i < allDescribeBlocks.length; i++) {
        let temp = allDescribeBlocks[i];
        if (temp.testId === testId) {
          parent = temp;
          break;
        }
      }

      if (parent) {
        afterEaches.push(parent.getAfterEaches());
        if (parent.parent) {
          getParentAfters(parent.parent.testId);
        }
      }
      else {
        throw new Error('this should not happen...');
      }
    }

    if (zuite.parent) {
      getParentAfters(zuite.parent.testId);
    }

    return _.flatten(afterEaches, true);
  }

  return {
    getAllAfterEaches,
    getAllBeforesEaches
  }
}


