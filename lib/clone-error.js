'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////

module.exports = function manuallyCloneError(err, newMessage, stripAllButTestFilePathMatch) {

  const obj = {};
  obj.message = newMessage || ' => Suman implementation error => newMessage is not defined. Please report.';
  let temp = err.stack.split('\n');
  if (stripAllButTestFilePathMatch !== false) {
    temp = temp.filter(function (line, index) {
      return !String(line).match(/\/node_modules\//);
    });
  }
  temp[0] = newMessage;
  temp = temp.map(function (item) {
    // return '\t' + item;
    return item;
  });
  obj.message = newMessage;
  obj.stack = temp.join('\n');
  return obj;

};
