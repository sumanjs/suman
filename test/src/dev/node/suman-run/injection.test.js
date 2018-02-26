#!/usr/bin/env node
'use strict';

import suman from 'suman';
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

1..times(function () {

  Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, $deps) {

    describe('test $core', (b, test) => {

      test('test $deps', t => {
        const {child_process, http} = $core;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test $deps', (b, test) => {

      test('test $deps', t => {
        const {child_process, http} = $deps;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test lodash to dash', (b, test) => {

      test('test $deps', t => {
        const {tcp_ping} = $deps;  // tcp_ping will load require('tcp-ping')

        t.assert(tcp_ping);

      });

    });

  });

  Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, $deps) {

    describe('test $core', (b, test) => {

      test('test $deps', t => {
        const {child_process, http} = $core;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test $deps', (b, test) => {

      test('test $deps', t => {
        const {child_process, http} = $deps;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test lodash to dash', (b, test) => {

      test('test $deps', t => {
        const {tcp_ping} = $deps;  // tcp_ping will load require('tcp-ping')

        t.assert(tcp_ping);

      });

    });

  });

});
