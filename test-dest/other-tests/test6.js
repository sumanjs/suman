'use strict';

/**
 * Created by denman on 12/2/2015.
 */

var suman = require('../../lib');
var Test = suman.init(module);

var should = require('should');

Test.describe('suite tres', {}, function (assert) {

    this.before.cb(function (t) {

        t.done();
        t.log('barf');
    });

    this.it.cb('my test99999', function (t) {

        setTimeout(function () {
            t.pass();
        }, 200);
    });

    this.afterEach.cb({ fatal: false }, function (t) {

        setTimeout(function () {

            var user = {
                name: 'tj',
                pets: ['tobi', 'loki', 'jane', 'bandit']
            };

            // assert(false);

            t.done();
        });
    });

    this.afterEach.cb({ fatal: false }, function (t) {

        setTimeout(t.wrap(function () {

            // assert(false);
            t.done();
        }));
    });

    this.describe('tarzan', function () {

        this.before(function (t) {});

        this.it('my tarzan test', function (t) {});

        this.describe('uuuuu test', function () {

            this.describe('uuuuu3333 test', function () {

                this.before.skip(function (t) {});

                // this.it.red('my 3333 test', function () {
                //
                // });
            });

            this.before(function () {});

            this.it('my boooz test', function () {});
        });
    });
});