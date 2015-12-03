/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite uno', function (suite) {


    this.before(function (done) {

        this.doggy = 'dooooggy';
        done();

    }).after(function (done) {

        done();

    }).it('makes stuff 1', function (done) {

        console.log(this.doggy);
        done();

    }).it('makes stuff 2', function (done) {

        console.log(this.doggy);
        done();

    });


    this.series([
        this.it('makes stuff 3', function () {

            console.log(this.doggy);

        }),
        this.it('makes stuff 4', function (done) {


            done(new Error('barf 4'));

        })
    ]);


    this.loop(['5', '6', '7'], function (value) {

        this.it('makes stuff ' + value, function (done) {

            console.log(this.doggy);
            done(new Error('barf 3'));

        });

    });


    this.parallel(function () {


        this.it('makes stuff 8', function (done) {

            console.log(this.doggy);
            done(new Error('barf 3'));

        }).it('makes stuff 9', function () {

            console.log(this.doggy);

        }).it('makes stuff 10', function (done) {

            done(new Error('barf 5'));

        });


    });


    this.parallel(function () {


            this.it('makes stuff 11', function (done) {

                console.log(this.doggy);
                done(new Error('barf 3'));

            });

            this.it('makes stuff 12', function (done) {

                console.log(this.doggy);
                done(new Error('barf 4'));

            });

            this.it('makes stuff 13', function (done) {

                console.log(this.doggy);
                done(new Error('barf 5'));

            });



    });


    this.after(function (done) {

        console.log(this.doggy);
        done();

    });


    this.describe('suite two', function () {

        this.before(function (done) {

            console.log(this.doggy);
            done();

        }).after(function (done) {


            done();

        }).it('makes stuff 14', function (done) {

            done();

        }).it('makes stuff 15', function (done) {

            console.log(this.doggy);
            done();

        });

        this.loop(['53', '63', '73'], function (value) {

            this.it('makes stuff ' + value, function (done) {

                console.log(this.doggy);
                done(new Error('barf 3'));

            });

        });


        this.describe('suite three', function () {

            this.before(function (done) {

                console.log('thisId:', this.testId, this.doggy);
                done();

            }).after(function (done) {

                console.log('testId:', this.testId, this.doggy);
                done();

            });

            this.loop(['59', '69', '79'], function (value) {

                this.it('makes stuff ' + value, function (done) {

                    console.log(this.doggy);
                    done();

                });

            });

            this.it('makes stuff 16', function (done) {

                console.log('testId:', test.testId, this.doggy);
                done();

            });

            this.it('makes stuff 17', function (done) {

                done();

            });


            this.describe('suite four', function () {

                console.log('testId:', test.testId, this.doggy);


                this.before(function (done) {

                    console.log('testId:', test.testId, this.doggy);
                    done();

                }).after(function (done) {

                    done();

                });

                this.it('makes stuff 18', function (done) {

                    done();
                });

                this.it('makes stuff 19', function (done) {

                    done();

                });

            });

        });

    });


    this.describe('suite five', function () {

        this.before(function (done) {


            done();

        }).after(function (done) {


            done();

        }).it('makes stuff 20', function (done) {


            done();


        }).it('makes stuff 21', function (done) {


            done();


        }).it('makes stuff 22', function (done) {

            done();


        });

    });

});