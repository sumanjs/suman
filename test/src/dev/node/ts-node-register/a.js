#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var suman = require("suman");
var Test = suman.init(module, {}, {
    allowSkip: true
}).Test;
var count = 0;
var opts = {
    series: true,
    fixed: true
};
Test.define(function (v) {
    debugger;
    v.inject('age', 'age', 'age')
        .names('b', 'before', 'after', 'afterEach')
        .run(function (b, before, after, afterEach, it) {
        it('is cool', function (t) {
        });
    })
        .run(function (b, before, after, afterEach, it) {
        it('is cool', function (t) {
        });
    });
});
Test.create(opts, ['rudolph', function (assert, describe, before, beforeEach, after, afterEach, it, inject) {
        before.last(function (h) {
            h.log('mucho before last 1');
        });
        before({ cb: true, retries: 4 }, function (h) {
            h.done();
        });
        before.define(function (v) {
            debugger;
            v.run(function (h) {
                console.log('in the run now 1.');
            });
            v.run(function (h) {
                console.log('in the run now 2.');
            });
        });
        before.last(function (h) {
            h.log('mucho before last 2');
        });
        before.last(function (h) {
            h.log('mucho before last 3');
        });
        before(function (h) {
            console.log('mucho before');
        });
        before.first(function (h) {
            console.log('mucho before first 1');
        });
        before.first(function (h) {
            console.log('mucho before first 2');
        });
        before.first(function (h) {
            console.log('mucho before first 3');
        });
        after.last(function (h) {
            console.log('me after last 3');
        });
        after(function (h) {
            console.log('me after 2');
        });
        after.first(function (h) {
            console.log('me first 1');
        });
        it('sync test hagieao agoeajgoea jo joeajgoea  aegjeag oa iag j aogeg ', function (t) {
            assert(false);
        });
        it.skip['retries:5, name:hi']('zoom', function (t) {
        });
        before('hi', [function (h) {
                h.assert.equal(++count, 1);
            }]);
        describe('nested1', {}, function (b) {
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
