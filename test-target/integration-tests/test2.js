'use strict';

/**
 * Created by denman on 12/3/15.
 */

var suman = require('../../lib');
var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida', 'charlie']
});

Test.describe('suite 2', { parallel: true }, function () {

    this.before.cb('D', function (t, done) {
        done();
    });

    var cars = [1, 2, 3];

    this.describe('desc', function () {

        this.describe('desc', function () {

            this.before.cb('C', function (t, done) {
                done();
            });

            this.it('does 1', function () {});

            this.it('does 2', function () {});
        });

        this.before.cb('B', function (t) {
            t.done();
        });

        this.it('does 3', function () {});

        this.describe('desc 4', function () {

            this.before.cb('A', function (t, done) {
                done();
            });

            this.it('does 4', function () {
                //should timeout because no callback is called
            });
        });
    });
});