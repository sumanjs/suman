/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman');
var Test = require('../../lib').init(module, 'suman.conf.js');


console.log('some bs');

Test.describe('gggg', {parallel: false}, function (http, delay, assert, fs, child_process, socketio, suite, whoa, cherry, https) {


    //console.log('child_process:',child_process);
    //console.log('http:',http);
    //console.log('https:',https);
    //console.log('cherry:', cherry);
    //console.log('whoa:', whoa);
    //console.log('suite:',suite);
    //console.log('fs:',fs);
    //console.log('assert:',assert);

    setTimeout(function () {
        delay();
    }, 100);

    this.describe('moodle', {parallel: false}, function () {

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


    this.describe('moodle', {parallel: true}, function () {

        this.beforeEach((t, done) => {
            setTimeout(function () {
                debug('before Each 1, ' + t.desc);
                done();
            }, 50);
        });

        this.beforeEach((t, done) => {
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

        }).it('mmm2', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 50);

        }).it('mmm3', {parallel: false}, (done, t) => {

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

        this.describe('x', function () {


            this.describe('y', function () {
                this.it('ddd', {
                    parallel: false
                }, function (t, done) {
                    setTimeout(function () {
                        done();
                    }, 50);
                });
            });


            this.it('cccc', {
                parallel: false
            }, function (t, done) {
                setTimeout(function () {
                    done();
                }, 50);
            });
        });


        this.it.ONLY('aaa1', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });


        this.it.ONLY('aaa2', {
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
