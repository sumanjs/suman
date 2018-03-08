#!/usr/bin/env ts-node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var suman = require("suman");
var Test = suman.init(module).Test;
Test.create(function (it) {
    it.cb('here', function (t) {
        t.done();
    });
});
Test.define('groovy', function (v) {
    v.timeout(1000)
        .source('age', 'age', 'age')
        .run((function (b, it, describe, test) {
        b.set('is', 'cool');
        test.cb.define('turtle')
            .series(true)
            .cb(true)
            .timeout(1000)
            .run(function (t) {
            t.assert.equal(b.get('is'), 'cool', 'sandy');
            t.done();
        });
        describe('inner', function (b) {
            it('is cool hand luke 1', function (t) {
            });
            it('is cool hand luke 2', function (t) {
            });
            it('is cool hand luke 3', function (t) {
            });
        });
    }));
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
        before.cb.define(function (v) {
            return v.timeout(300)
                .run(function (h) {
                h.ctn();
            });
        });
        it('is cool 2', function (t) {
        });
    });
});
