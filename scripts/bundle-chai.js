const util = require('util');
const chai = require('chai');
var assert = chai.assert;    // Using Assert style

let fn = function (err) {
  console.log('caught!', err);
};

let ourAssert = function () {
  try {
    return assert.apply(this, arguments);
  }
  catch (err) {
    return fn(err);
  }
};

var t = {
  assert: ourAssert
};

console.log(util.inspect(Object.getPrototypeOf(assert)));

Object.keys(assert).forEach(function (key) {

  t.assert[key] = function () {
    try {
      return assert[key].apply(assert, arguments);
    }
    catch (err) {
      return fn(err);
    }
  }

});



