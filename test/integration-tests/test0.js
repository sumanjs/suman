/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.describe('gggg', {parallel: true}, function () {

    this.describe('moodle', {
        parallel: true
    }, function () {

        this.before(done => {
            setTimeout(function () {
                debug('before1, ');
                done();
            }, 500);

        });

        this.before(done => {
            setTimeout(function () {
                debug('before2, ');
                done();
            }, 500);
        });

        this.before(done => {
            setTimeout(function () {
                debug('before3, ');
                done();
            }, 500);
        });

        this.after(function () {
            debug('after, d ');
        });
    });


    this.describe('moodle', {
        parallel: true
    }, function () {

        this.beforeEach((t, done) => {
            setTimeout(function () {
                debug('before Each 1, ' + t.desc);
                done();
            }, 500);
        });

        this.beforeEach((t, done)=> {
            setTimeout(function () {
                debug('before Each 2, ' + t.desc);
                done();
            }, 500);
        });

        this.beforeEach((t, done) => {
            setTimeout(function () {
                debug('before Each 3, ' + t.desc);
                done();
            }, 500);
        });

        this.it('mmm1', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it('mmm2', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it('mmm3', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.beforeEach(function (t, done) {
            setTimeout(function () {
                debug('before Each 4, ' + t.desc);
                done();
            }, 500);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {
                debug('after Each 1, ' + t.desc);
                done();
            }, 500);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {
                debug('after Each 2, ' + t.desc);
                done();
            }, 500);
        });

        this.after(function () {
            debug('after, a ');
        });


    });


    this.describe('bum', {parallel: true}, function () {


        this.it('aaa1', {
            parallel: true
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });


        this.it('aaa2', {
            parallel: true
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });


        this.it('aaa3', {
            parallel: true
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });

        this.it('aaa4', {
            parallel: true
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 500);

        });

        this.after(function () {
            debug('after, b ');
        });

    });

    this.after(function () {
        debug('after, c');
    });

});
