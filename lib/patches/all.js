/**
 * Created by alexamil on 2/21/17.
 */


var timesFunction = function(callback) {
  if (typeof callback !== 'function' ) {
    throw new TypeError('Callback is not a function');
  } else if( isNaN(parseInt(Number(this.valueOf()))) ) {
    throw new TypeError('Object/value is not a valid number');
  }
  for (var i = 0; i < Number(this.valueOf()); i++) {
    callback(i);
  }
};

String.prototype.times = timesFunction;
Number.prototype.times = timesFunction;
