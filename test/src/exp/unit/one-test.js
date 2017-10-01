var timesFunction = function (callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback is not a function');
  } else if (isNaN(parseInt(Number(this.valueOf())))) {
    throw new TypeError('Object is not a valid number');
  }
  for (var i = 0; i < Number(this.valueOf()); i++) {
    callback(i);
  }
};

Number.prototype.times = timesFunction;
String.prototype.times = timesFunction;

5..times(function (val) {
  console.log(val);
});


"5".times(function (val) {

  console.log(val);

});
