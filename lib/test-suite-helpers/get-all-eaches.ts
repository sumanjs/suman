'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";
import {IBeforeEachObj} from "suman-types/dts/before-each";
import {IAFterEachObj} from "suman-types/dts/after-each";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');
import assert = require('assert');

//npm
import * as _ from 'lodash';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////

export const getAllBeforesEaches = function (zuite: ITestSuite) {

  const beforeEaches: Array<Array<IBeforeEachObj>> = [];
  beforeEaches.unshift(zuite.getBeforeEaches());

  if (!zuite.alreadyHandledAfterAllParentHooks) {
    zuite.alreadyHandledAfterAllParentHooks = true;
    beforeEaches.unshift(zuite.getAfterAllParentHooks());
  }

  function getParentBefores(parent: ITestSuite) {

    if (parent) {
      beforeEaches.unshift(parent.getBeforeEaches());
      if (parent.parent) {
        getParentBefores(parent.parent);
      }
    }
    else {
      throw new Error(' => Suman implementation error => please report on Github.');
    }

  }

  if (zuite.parent) {
    getParentBefores(zuite.parent);
  }

  return _.flatten(beforeEaches);
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
      throw new Error(' => Suman implementation error => please report on Github.');
    }
  }

  if (zuite.parent) {
    getParentAfters(zuite.parent);
  }

  return _.flatten(afterEaches);
};





