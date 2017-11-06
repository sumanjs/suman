#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////


1..times(function(){

  Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, $deps) {

    describe('test $core', (s, test) => {

      test('test $deps', t => {
        const {child_process, http} = $core;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test $deps', (s, test) => {

      test('test $deps', t => {
        const {child_process, http} = $deps;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test lodash to dash', (s, test) => {

      test('test $deps', t => {
        const {tcp_ping} = $deps;  // tcp_ping will load require('tcp-ping')

        t.assert(tcp_ping);

      });


    });

  });


  Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core, $deps) {

    describe('test $core', (s, test) => {

      test('test $deps', t => {
        const {child_process, http} = $core;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test $deps', (s, test) => {

      test('test $deps', t => {
        const {child_process, http} = $deps;
        const cp = require('child_process');
        const $http = require('http');

        t.assert.equal(child_process, cp);
        t.assert.equal(http, $http);

      });

    });

    describe('test lodash to dash', (s, test) => {

      test('test $deps', t => {
        const {tcp_ping} = $deps;  // tcp_ping will load require('tcp-ping')

        t.assert(tcp_ping);

      });


    });

  });


});
