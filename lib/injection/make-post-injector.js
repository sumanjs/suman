'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const {$core, $deps, mappedPkgJSONDeps} = require('../injection/$core-n-$deps');

/////////////////////////////////////////////////////////////////

module.exports = function ($data, $preData) {

  return function (names) {

    return names.map(function (n) {

      if (n === '$core') {
        return $core;
      }

      if (n === '$deps') {
        return $deps;
      }

      if (n === '$data') {
        return $data;
      }

      if (n === '$root') {
        return _suman.projectRoot;
      }

      if (n === '$pre') {
        return $preData || _suman['$pre'];
      }

      try {
        return require(n);
      }
      catch (err) {
        _suman.logError(colors.yellow('warning => [suman.once.post injector] => Suman will continue optimistically, ' +
          'but cannot require dependency with name => "' + n + '"'));
        return null;
      }

    });

  }

};
