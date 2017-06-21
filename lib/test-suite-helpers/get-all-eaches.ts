'use strict';
import {IAFterEachObj, IBeforeEachObj, ITestSuite} from "../../dts/test-suite";
import {IGlobalSumanObj} from "../../dts/global";
import {ISuman} from "../../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const _ = require('underscore');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////

export const getAllBeforesEaches = function (zuite: ITestSuite) {

  const beforeEaches: Array<Array<IBeforeEachObj>> = [];
  beforeEaches.unshift(zuite.getBeforeEaches());

  function getParentBefores(parent: ITestSuite) {

    if (parent) {
      beforeEaches.unshift(parent.getBeforeEaches());
      if (parent.parent) {
        getParentBefores(parent.parent);
      }
    }
    else {
      throw new Error(' => Suman implementation error => this should not happen...please report.');
    }

  }

  if (zuite.parent) {
    getParentBefores(zuite.parent);
  }

  return _.flatten(beforeEaches, true);
};

export const getAllAfterEaches = function (zuite: ITestSuite) {

  const afterEaches: Array<Array<IAFterEachObj>> = [];
  afterEaches.push(zuite.getAfterEaches());

  function getParentAfters(parent: ITestSuite) {


    if (parent) {
      afterEaches.push(parent.getAfterEaches());
      if (parent.parent) {
        getParentAfters(parent.parent);
      }
    }
    else {
      throw new Error(' => Suman implementation error => this should not happen...please report.');
    }
  }

  if (zuite.parent) {
    getParentAfters(zuite.parent);
  }

  return _.flatten(afterEaches, true);
};


const $exports = module.exports;
export default $exports;




