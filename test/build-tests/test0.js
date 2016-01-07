/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.new('gggg', function () {

    this.describe('moodle', {
        parallel: true
    }, function () {

        this.before(function (done) {
            setTimeout(function () {
                debug('before1');
                done();
            }, 1000);

        });

        this.before(function (done) {
            setTimeout(function () {
                debug('before2');
                done();
            }, 1000);
        });

        this.before(function (done) {
            setTimeout(function () {
                debug('before3');
                done();
            }, 1000);
        });
    });


    this.describe('moodle', {
        parallel: true
    }, function () {

        this.beforeEach(function (done) {

            setTimeout(function () {
                debug('before Each 1');
                done();
            }, 1000);
        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                debug('before Each 2');
                done();
            }, 1000);
        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                debug('before Each 3');
                done();
            }, 1000);
        });

        this.it('mmm1', {parallel: false}, function (done) {

            setTimeout(function () {
                done();
            }, 1000);

        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                debug('after Each 1');
                done();
            }, 1000);
        });

        this.afterEach(function (done) {

            setTimeout(function () {
                debug('after Each 2');
                done();
            }, 1000);
        });

        this.afterEach(function (done) {

            setTimeout(function () {
                debug('after Each 3');
                done();
            }, 1000);
        });


    });


    this.describe('bum', {parallel: true}, function () {

        debug('describe');

        this.it('mmm1', {
            parallel: true
        }, function (done) {

            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

    });


});