/**
 * Created by denman on 1/3/2016.
 */


/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('gggg', function () {

    this.after(function (done) {
        debug('6');
        done();
    });

    this.describe(function () {

        this.after(function (done) {
            debug('3');
            done();
        });

        this.describe(function () {

            this.after(function (done) {
                debug('3');
                done();
            });
        });
    });

    this.describe(function () {

        this.after(function (done) {
            debug('3');
            done();
        });

        this.describe(function () {

            this.after(function (done) {
                debug('3');
                done();
            });

            this.describe(function () {

                this.after(function (done) {
                    debug('3');
                    done();
                });

                this.describe(function () {

                    this.after(function (done) {
                        debug('3');
                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {
                            debug('3');
                            done();
                        });
                    });
                });

                this.describe(function () {

                    this.after(function (done) {
                        debug('3');
                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {
                            debug('3');
                            done();
                        });
                    });
                });


            });

        });
    });


    this.describe('moodle', {
        parallel: false
    }, function () {

        this.after(function (done) {
            debug('1');
            done();
        });


        this.it('mmm1', {parallel: false}, (t, done) => {

            done();

        });


        this.after(function (done) {
            debug('2');
            done();
        });


    });

    this.after(function (done) {
        debug('4');
        done();
    });


    this.after(function (done) {
        debug('7');
        done();
    });

});