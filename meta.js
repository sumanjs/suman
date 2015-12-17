/**
 * Created by amills001c on 11/24/15.
 */


console.log('NODE_ENV:', process.env.NODE_ENV);

var testRunner = require('./index').Runner;

testRunner('./test/build-tests','suman.conf.js');