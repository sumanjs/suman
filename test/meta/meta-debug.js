/**
 * Created by denman on 1/1/2016.
 */


console.log('NODE_ENV:', process.env.NODE_ENV);

var appRootPath = require('app-root-path');
var path = require('path');

var testRunner = require('../../lib/runner');

var dirOrFile = path.resolve(appRootPath.path + '/test/other-tests');

testRunner(dirOrFile,'suman.conf.js');

