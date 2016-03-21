'use strict';

/**
 * Created by denman on 12/2/2015.
 */

var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('foo', function () {

    this.before(function () {});

    this.after(function () {});

    this.it('4', function (t, done) {

        setTimeout(function () {
            done();
        }, 1000);
    });

    this.beforeEach(function (t, done) {

        done();
    });

    this.describe('2', function () {

        this.before(function () {});

        this.describe('3', { parallel: true }, function () {

            this.beforeEach(function (t) {});

            this.it('it 5555', function (t, done) {

                setTimeout(function () {
                    done();
                }, 1000);
            });

            this.it('66666six', function (t, done) {

                setTimeout(function () {
                    done();
                }, 1000);
            });

            this.after(function () {});
        });

        this.after(function () {});
    });

    this.after(function () {});
});