'use strict';

/**
 * Created by denman on 12/3/15.
 */

var suman = require('../../lib');
var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida', 'charlie']
});

Test.describe('suite 2', function () {

    this.before('D', function (done) {
        done();
    });

    var cars = [1, 2, 3];

    this.loop(cars, function (value) {

        this.it('fantasy', function () {});
    });

    this.describe('desc', function () {

        this.describe('desc', function () {

            this.before('C', function (done) {

                done();
            });

            this.it('does 1', function () {});

            this.it('does 2', function () {});
        });

        this.before('B', function (done) {

            done();
        });

        this.it('does 3', function () {});

        this.describe('desc 4', function () {

            this.before('A', function (done) {

                done();
            });

            this.it('does 4', function () {});
        });
    });
});