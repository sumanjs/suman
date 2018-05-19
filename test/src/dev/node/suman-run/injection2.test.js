#!/usr/bin/env ts-node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module, {
    override: {
        opts: {
            allowSkip: true,
        },
        config: {}
    }
}).Test;
var count = 0;
var opts = {
    series: true,
    fixed: true
};
global.Promise = require('bluebird');
Test.create(opts, ['rudolph', function (b, assert, describe, before, beforeEach, after, afterEach, it, inject) {
        inject('eage', function (t) {
            return t.registerFnMap({
                a: function (cb) {
                    return process.nextTick(cb, null, 'dogs');
                },
                b: function (cb) {
                    process.nextTick(cb, null, 'dogs');
                }
            });
        });
        it('hagieao agoeajgoea', function (t) {
            t.assert(true);
        });
        it.skip['retries:5, name:hi']('zoom', function (t) {
        });
        before('hi', [function (h) {
                h.assert.equal(++count, 1);
            }]);
        describe('zoom', function (b) {
            describe('nested1', {}, function (b) {
                var a = b.getInjectedValue('a');
                console.log('a is => ', a);
                b.set('a', true);
                assert.equal(count, 0);
                before(function (h) {
                    h.assert(h.get('a'));
                    h.assert.equal(++count, 2);
                });
                it('sync test', function (t) {
                    assert(true);
                });
                after(function (h) {
                    h.assert.equal(++count, 5);
                });
                describe('nested2', {}, function (b) {
                    assert(b.get('a'));
                    assert.equal(count, 0);
                    it('sync test', function (t) {
                        assert(true);
                    });
                    before(function (h) {
                        h.assert.equal(++count, 3);
                    });
                    after(function (h) {
                        h.assert.equal(++count, 4);
                    });
                });
            });
        });
        describe('nested3', function (b) {
            assert.equal(count, 0);
            before('zoomy', function (h) {
                h.assert.equal(++count, 6);
            });
            it('sync test', function (t) {
                assert(true);
            });
        });
        after.last('roomy', function (h) {
            h.assert.equal(++count, 8);
        });
        after.always('roomy', function (h) {
            h.assert.equal(++count, 7);
        });
    }]);
