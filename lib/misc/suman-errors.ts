'use strict';

//dts
import {ISuman} from "../../dts/suman";

//project
const {constants} = require('../../config/suman-constants');
const {fatalRequestReply} = require('../helpers/fatal-request-reply');

function SumanError() {

}

SumanError.prototype = Object.create(Error.prototype);
SumanError.prototype.constructor = SumanError;

let control = function (isThrow: boolean, err: Error) {
  if (isThrow) {
    throw err;
  }
  else {
    return err;
  }
};

function filter(suman: ISuman, isFatal: boolean, err?: Error) {

  const stack = err.stack || err;

  let firstMatch = false;
  let type = isFatal ? 'FATAL' : 'NON_FATAL_ERR';

  return fatalRequestReply({
    type: type,
    data: {
      msg: stack
    }
  }, function () {

    if (isFatal) {
      process.exit(constants.EXIT_CODES.BAD_CONFIG_OR_PROGRAM_ARGUMENTS);
    } else {
      process.stdout.write('\n' + stack + '\n');
    }

  });

}

export const noHost = function (isThrow: boolean) {
  return control(isThrow, new Error('no host defined'));
};

export const noPort = function (isThrow: boolean) {
  return control(isThrow, new Error('no port defined'));
};

export const badArgs = function (suman: ISuman, isFatal: boolean, err: Error) {
  return filter(suman, isFatal, err);
};

const $default = module.exports;
export default $default;



