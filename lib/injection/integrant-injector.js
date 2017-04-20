'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const {$core, $deps, mappedPkgJSONDeps} = require('../injection/$core-n-$deps');

/////////////////////////////////////////////////////////////////

module.exports = function (names) {

  return names.map(function (n) {

    if (n === '$core') {
      return $core;
    }

    if (n === '$deps') {
      return $deps;
    }

    if (n === '$root') {
      return _suman.projectRoot;
    }

    try {
      return require(n);
    }
    catch (err) {
      console.error(' => Suman warning => Suman will continue optimistically, ' +
        'but cannot require dependency with name => ' + n);
      return null;
    }

  });

};
