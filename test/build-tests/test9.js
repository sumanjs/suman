/**
 * Created by denman on 1/3/2016.
 */


/**
 * Created by denman on 1/1/2016.
 */



var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.after(function (done) {
        console.log('6');
        done();
    });

    this.describe(function () {

        this.after(function (done) {
            console.log('3');
            done();
        });

        this.describe(function () {

            this.after(function (done) {
                console.log('3');
                done();
            });
        });
    });

    this.describe(function () {

        this.after(function (done) {
            console.log('3');
            done();
        });

        this.describe(function () {

            this.after(function (done) {
                console.log('3');
                done();
            });

            this.describe(function () {

                this.after(function (done) {
                    console.log('3');
                    done();
                });

                this.describe(function () {

                    this.after(function (done) {
                        console.log('3');
                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {
                            console.log('3');
                            done();
                        });
                    });
                });

                this.describe(function () {

                    this.after(function (done) {
                        console.log('3');
                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {
                            console.log('3');
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
            console.log('1');
            done();
        });


        this.it('mmm1', {parallel: false}, function (done) {

            done();

        });


        this.after(function (done) {
            console.log('2');
            done();
        });


    });

    this.after(function (done) {
        console.log('4');
        done();
    });


    this.after(function (done) {
        console.log('7');
        done();
    });

});