#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var suman = require("suman");
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
