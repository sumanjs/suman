/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman');
var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.describe('gggg', {parallel: false}, function () {

    this.describe('moodle', {
        parallel: false
    }, function () {

        this.before(done => {
            setTimeout(function () {
                done();
            }, 50);

        });

        this.before(done => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(done => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.after(function () {
        });
    });


    this.describe('moodle', {
        parallel: true
    }, function () {

        this.beforeEach((t, done) => {
            setTimeout(function () {
                debug('before Each 1, ' + t.desc);
                done();
            }, 50);
        });

        this.beforeEach((t, done)=> {
            setTimeout(function () {
                debug('before Each 2, ' + t.desc);
                done();
            }, 50);
        });

        this.beforeEach((t, done) => {
            setTimeout(function () {
                debug('before Each 3, ' + t.desc);
                done();
            }, 50);
        });

        this.it('mmm1', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 50);

        });

        this.it('mmm2', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 50);

        });

        this.it('mmm3', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 50);

        });

        this.beforeEach(function (t, done) {
            setTimeout(function () {
                debug('before Each 4, ' + t.desc);
                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {
                debug('after Each 1, ' + t.desc);
                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {
                debug('after Each 2, ' + t.desc);
                done();
            }, 50);
        });

        this.after(function () {
            debug('after, a ');
        });


    });


    this.describe('bum', {parallel: false}, function () {


        this.it('aaa1', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });


        this.it('aaa2', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });


        this.it('aaa3', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('aaa4', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);

        });

        this.after(function () {
            debug('after, b ');
        });

    });

    this.after(function () {
        debug('after, c');
    });

});
