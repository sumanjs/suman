'use strict';

// add a MF utility method to Number.prototype and String.prototype
String.prototype.times = Number.prototype.times = function (callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback is not a function');
  } else if (isNaN(parseInt(Number(this.valueOf())))) {
    throw new TypeError('Object/value is not a valid number');
  }
  for (var i = 0; i < Number(this.valueOf()); i++) {
    callback(i);
  }
};

// monkey patch process#exit FTMFW
const exit = process.exit;
process.exit = function (code, fn) {
  if (fn) {
    fn(function (err, code) {
      if (err) {
        exit.call(process, (code || 1));
      }
      else {
        exit.call(process, (code || 0));
      }
    });
  }
  else {
    exit.call(process, code);
  }
};
