/**
 * Created by denman on 1/1/2016.
 */


if(require.main === module){
    //prevents users from fucking up by accident and getting in an infinite loop that will lock up their system
    return;
}


console.log('NODE_ENV:', process.env.NODE_ENV);

var appRootPath = require('app-root-path');
var path = require('path');

var testRunner = require('../../lib/runner');

var dirOrFile = './test/other-tests';

testRunner([dirOrFile],'suman.conf.js');

