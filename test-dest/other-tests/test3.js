'use strict';

/**
 * Created by denman on 12/2/2015.
 */

var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('foo', function () {

    this.before(function (t) {});

    this.after(function (t) {});

    this.it.cb('4', function (t) {

        setTimeout(function () {
            t.done();
        }, 1000);
    });

    this.beforeEach.cb(function (t) {
        t.done();
    });

    this.describe('2', function () {

        this.before(function (t) {});

        this.describe('3', { parallel: true }, function () {

            this.beforeEach(function (t) {});

            this.it.cb('it 5555', function (t) {

                setTimeout(function () {
                    t.done();
                }, 1000);
            });

            this.it.cb('66666six', function (t) {

                setTimeout(function () {
                    t.done();
                }, 1000);
            });

            this.after(function (t) {});
        });

        this.after(function (t) {});
    });

    this.after(function (t) {});
});