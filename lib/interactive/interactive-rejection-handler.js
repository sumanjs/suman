'use striiiict';

//npm
const colors = require('colors/safe');

module.exports = function (err) {

  console.error(
    '\n\n',
    colors.bgRed.white.bold(' => Suman implemenation error => Error captured by catch block =>'),
    '\n',
    colors.red(err.stack || err),
    '\n\n'
  );

};