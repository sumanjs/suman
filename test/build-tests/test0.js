/**
 * Created by denman on 1/1/2016.
 */



var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.describe('moodle', {
        isParallel: true
    }, function () {

        this.before(function (done) {
            setTimeout(function () {
                console.log('before1');
                done();
            }, 2000);

        });

        this.before(function (done) {
            setTimeout(function () {
                console.log('before2');
                done();
            }, 2000);
        });

        this.before(function (done) {
            setTimeout(function () {
                console.log('before3');
                done();
            }, 2000);
        });
    });


    this.describe('moodle', {
        isParallel: true
    }, function () {

        this.beforeEach(function (done) {

            setTimeout(function () {
                console.log('before Each 1');
                done();
            }, 2000);
        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                console.log('before Each 2');
                done();
            }, 2000);
        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                console.log('before Each 3');
                done();
            }, 2000);
        });

        this.it('mmm1', {parallel: false}, function (done) {

            setTimeout(function () {
                done();
            }, 2000);

        });

        this.beforeEach(function (done) {

            setTimeout(function () {
                console.log('after Each 1');
                done();
            }, 2000);
        });

        this.afterEach(function (done) {

            setTimeout(function () {
                console.log('after Each 2');
                done();
            }, 2000);
        });

        this.afterEach(function (done) {

            setTimeout(function () {
                console.log('after Each 3');
                done();
            }, 2000);
        });


    });


    this.describe('bum', {isParallel: true}, function () {

        console.log('describe');

        this.it('mmm1', {
            parallel: true
        }, function (done) {

            setTimeout(function () {
                done();
            }, 2000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 2000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 2000);

        });

        this.it('mmm2', {
            parallel: true
        }, function (done) {
            setTimeout(function () {
                done();
            }, 2000);

        });

    });


});