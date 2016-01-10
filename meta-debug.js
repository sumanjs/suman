/**
 * Created by denman on 1/1/2016.
 */


console.log('NODE_ENV:', process.env.NODE_ENV);

var testRunner = require('./lib/runner');

testRunner('./test/other-tests','suman.conf.js');

