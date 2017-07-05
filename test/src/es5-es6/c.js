#!/usr/bin/env node

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const patch = require('../../../lib/patches/all');

process.on('uncaughtException', function (err) {
  debugger;
  console.log(' This is uncaught => ', err);
});

const domain = require('domain');
const d = domain.create();

d.on('error', function (err) {
  console.error(' => Domain caught => ', err);
});

d.run(function () {

  return new Promise(function (resolve, reject) {

    setTimeout(function () {

      process.nextTick(function () {
        setTimeout(function () {
          throw new Error('rah');
        }, 100);

      }, 100);

    });

  });

});
