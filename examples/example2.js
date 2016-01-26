/**
 * Created by amills001c on 1/25/16.
 */


var Test = require('suman').Test(module, 'suman.conf.js');


Test.describe('gggg', function () {

    this.after(function (done) {

        done();
    });

    this.describe(function () {

        this.after(function (done) {

            done();
        });

        this.describe(function () {

            this.after(function (done) {

                done();
            });
        });
    });

    this.describe(function () {

        this.after(function (done) {

            done();
        });

        this.describe(function () {

            this.after(function (done) {

                done();
            });

            this.describe(function () {

                this.after(function (done) {

                    done();
                });

                this.describe(function () {

                    this.after(function (done) {

                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {

                            done();
                        });
                    });
                });

                this.describe(function () {

                    this.after(function (done) {

                        done();
                    });
                    this.describe(function () {

                        this.after(function (done) {

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

            done();
        });


        this.it('mmm1', {parallel: false}, (t, done) => {

            done();

        });


        this.after(function (done) {

            done();
        });


    });


    this.after(function (done) {

        done();
    });


    this.after(function (done) {

        done();
    });


});