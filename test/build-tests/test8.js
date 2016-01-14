/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('gggg', function () {

    this.beforeEach(function (t,done) {

        done();
    });

    this.after(function (done) {

        done();
    });

    this.after(function (done) {

        done();
    });

    this.describe(function () {

        this.after(function (done) {

            done();
        });

        this.beforeEach(function (t,done) {

            done();
        });


        this.describe('moodle', {
            parallel: true
        }, function () {

            this.after(function (done) {

                done();
            });

            this.beforeEach(function (t,done) {

                //throw new Error('yikies');
                done();
            });


            this.it('mmm1', {parallel: false}, function (t,done) {

                done();

            });

            this.it('mmm2', {parallel: false}, function (t,done) {

                done();

            });

            this.it('mmm3', {parallel: false}, function (t,done) {

                done();

            });

            this.beforeEach(function (t,done) {

                done();
            });

            this.afterEach(function (t,done) {

                done();
            });


            this.after(function (done) {

                done();
            });


        });

        this.after(function (done) {

            done();
        });


    });

    this.before(function (done) {

        done();
    });

    this.it('7777', {parallel: false}, function (t,done) {

        done();

    });

    this.after(function (done) {

        done();
    });
});