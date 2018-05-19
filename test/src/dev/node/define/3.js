#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module).Test;
Test.create(function () {
});
Test.define('groovy', function (v) {
    v.mode('parallel')
        .source()
        .names()
        .run(function (t) { })
        .timeout(10)
        .mode('parallel')
        .run(function (b, it, describe, test) {
        b.set('is', 'cool');
        test.define('yes')
            .series(true);
        test.series.cb.define('turtle')
            .timeout(10)
            .run(function (t) {
            t.assert.equal(b.get('is'), 'cool', 'sandy');
        });
        describe('inner', function (b) {
            it('is cool hand luke 1', function (t) {
            });
            it('is cool hand luke 2', function (t) {
            });
            it('is cool hand luke 3', function (t) {
            });
        });
    });
});
Test.define(function (v) {
    v.inject()
        .source('mika')
        .run(function (b, before, after, afterEach, it) {
        var mika = b.ioc.mika;
        before.define(function (v) {
            return v.first(true)
                .timeout(300)
                .run(function (h) {
            });
        });
        it('is cool 1', function (t) {
        });
    })
        .run(function (b, before, after, afterEach, it) {
        before.define(function (v) {
            return v.timeout(3000)
                .cb(true)
                .run(function (h) {
            });
        });
        it('is cool 2', function (t) {
        });
    });
});
