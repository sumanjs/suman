#!/usr/bin/env node
'use strict';
exports.__esModule = true;
var suman = require("suman");
// rock in roll
var Test = suman.init(module, {
    ioc: {
        b: 'far',
        a: 'foo',
        c: 'charge'
    },
    pre: ['three', 'two']
});
Test.create(function (assert, before, beforeEach, it, after, afterEach) {
    before(function (h) {
    });
    console.log('yolo');
    it('is great', function (t) {
    });
    it('is great', function (t) {
        throw new Error('fml');
    });
});
