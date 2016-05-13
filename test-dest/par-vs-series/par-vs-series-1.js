'use strict';

/**
 * Created by denmanm1 on 4/17/16.
 */

var suman = require('../../lib');
var Test = suman.init(module, {});

Test.describe('1', { mode: 'series' }, function () {

    this.it.cb('one', function (t) {

        setTimeout(function () {
            t.done();
        }, 2000);
    });

    this.it.cb('two', function (t) {

        setTimeout(function () {
            t.done();
        }, 2000);
    });

    this.it.cb('three', function (t) {

        setTimeout(function () {
            t.done();
        }, 2000);
    });
});