/**
 * Created by denman on 1/1/2016.
 */



const suman = require('../../lib');

var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida']
});


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
                done();
            }, 50);
        }).beforeEach((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        }).beforeEach((t, done) => {
            setTimeout(function () {
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

                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.after(function () {

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


        this.it.SKIP('aaa1', {
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

        });

    });


    this.after(function () {

    });

});
