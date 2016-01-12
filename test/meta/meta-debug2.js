/**
 * Created by denman on 1/9/2016.
 */


console.log('NODE_ENV:', process.env.NODE_ENV);

var testRunner = require('./lib/runner');

testRunner(null,'suman.conf.js',JSON.stringify(require('./test/all.js')));

