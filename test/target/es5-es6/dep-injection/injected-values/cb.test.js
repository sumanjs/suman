'use strict';

var suman = require('suman');
var Test = suman.init(module, {});

var async = require('async');

Test.create('example', function (before, describe, inject) {

    inject.cb(function (j) {

        j(null, {
            sam: 5
        });
    });

    describe('inner-hooks', function (before, sam) {

        console.log('sam => ', sam);

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b1) !');
            });
        });

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b2) !');
            });
        });

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b3) !');
            });
        });
    });

    describe('inner', function (it) {

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (1) !');
            });
        });

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (2) !');
            });
        });

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (3) !');
            });
        });
    });
});