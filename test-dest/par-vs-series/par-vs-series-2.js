'use strict';

/**
 * Created by denmanm1 on 4/17/16.
 */

var suman = require('../../lib');

var Test = suman.init(module, {});

Test.describe('2', { parallel: false }, function () {

    this.it('one', function (done) {

        setTimeout(function () {
            done();
        }, 2000);
    });

    this.it('two', function (done) {

        setTimeout(function () {
            done();
        }, 2000);
    });

    this.it('three', function (done) {

        setTimeout(function () {
            done();
        }, 2000);
    });
});