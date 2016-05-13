'use strict';

/**
 * Created by denman on 12/1/15.
 */

var Test = require('../../lib').init(module, 'suman.conf.js');

Test.describe('suite dos', function (assert) {

    var count = 0;

    this.beforeEach(function (t) {
        console.log(t.data);
        count++;
    });

    this.beforeEach.cb(function (t) {
        console.log(t.data);
        count++;
        t.ctn();
    });

    this.beforeEach.cb.skip(function (t) {
        console.log(t.data);
        count++;
    });

    this.beforeEach.skip.cb(function (t) {
        console.log(t.data);
        count++;
    });

    this.it('my 888', function (t) {
        t.data.rooogo = 'bar';
    });

    this.it('my 888', function (t) {
        t.data.rooogo = 'foo';
    });

    this.afterEach.cb(function (t) {
        console.log(t.data);
        count++;
        t.done();
    });

    this.afterEach(function (t) {
        console.log(t.data);
        count++;
    });

    this.afterEach.cb(function (t) {
        console.log(t.data);
        count++;
        t.done();
    });

    this.after(function (t) {
        assert(count === 10);
    });
});