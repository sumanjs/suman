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
            var self = this;
            setTimeout(function () {
                debug('before1, ' + self.desc);
                done();
            }, 1000);

        });

        this.before(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before2, ' + self.desc);
                done();
            }, 1000);
        });

        this.before(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before3, ' + self.desc);
                done();
            }, 1000);
        });
    });


    this.describe('moodle', {
        parallel: true
    }, function () {

        this.beforeEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before Each 1, ' + self.currentTest.desc);
                done();
            }, 1000);
        });

        this.beforeEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before Each 2, ' + self.currentTest.desc);
                done();
            }, 1000);
        });

        this.beforeEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before Each 3, ' + self.currentTest.desc);
                done();
            }, 1000);
        });

        this.it('mmm1', {parallel: false}, function (done) {

            setTimeout(function () {
                done();
            }, 1000);

        });

        this.beforeEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('before Each 4, ' + self.currentTest.desc);
                done();
            }, 1000);
        });

        this.afterEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('after Each 1, ' + self.currentTest.desc);
                done();
            }, 1000);
        });

        this.afterEach(function (done) {
            var self = this;
            setTimeout(function () {
                debug('after Each 2, ' + self.currentTest.desc);
                done();
            }, 1000);
        });


    });


    this.describe('bum', {parallel: true}, function () {

        debug('describe');

        this.it('aaa1', {
            parallel: true
        }, function (done) {

            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('aaa2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('aaa3', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

        this.it('aaa4', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 1000);

        });

    });


});