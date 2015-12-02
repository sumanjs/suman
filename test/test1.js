/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite uno', function (test) {



    test.before(function (done) {


        this.doggy = 'dooooggy';

        done();

    }).after(function (done) {

        done();

    });


    test.it('makes stuff 1', function (done) {

       console.log(this.doggy);
        done();

    }).it('makes stuff 2', function (done) {

        console.log(this.doggy);
        done();

    });


    test.series([
        test.it('makes stuff 3', function () {

            console.log(this.doggy);

        }),
        test.it('makes stuff 4', function (done) {


            done(new Error('barf 4'));

        })
    ]);


    test.loop(['5','6','7'], function (test, value) {

        test.it('makes stuff ' + value, function (done) {

            console.log(this.doggy);
            done(new Error('barf 3'));

        });

    });


    test.parallel(function (test) {


        test.it('makes stuff 8', function (done) {

            console.log(this.doggy);
            done(new Error('barf 3'));

        }).it('makes stuff 9', function () {

            console.log(this.doggy);

        }).it('makes stuff 10', function (done) {

            done(new Error('barf 5'));

        });


    });


    test.parallel(function (test) {


        test.it('makes stuff 11', function (done) {

            console.log(this.doggy);
            done(new Error('barf 3'));

        });

        test.it('makes stuff 12', function (done) {

            console.log(this.doggy);
            done(new Error('barf 4'));

        });

        test.it('makes stuff 13', function (done) {

            console.log(this.doggy);
            done(new Error('barf 5'));

        });


    });


    test.after(function (done) {

        console.log(this.doggy);
        done();

    });


    test.describe('suite two', function (test) {

        test.before(function (done) {

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

        test.loop(['53','63','73'], function (test, value) {

            test.it('makes stuff ' + value, function (done) {

                console.log(this.doggy);
                done(new Error('barf 3'));

            });

        });


        test.describe('suite three', function (test) {

            test.before(function (done) {

                console.log('testId:',test.testId,this.doggy);
                done();

            }).after(function (done) {

                console.log('testId:',test.testId,this.doggy);
                done();

            });

            test.loop(['59','69','79'], function (test, value) {

                test.it('makes stuff ' + value, function (done) {

                    console.log(this.doggy);
                    done();

                });

            });

            test.it('makes stuff 16', function (done) {

                console.log('testId:',test.testId,this.doggy);
                done();

            });

            test.it('makes stuff 17', function (done) {

                done();

            });

            test.describe('suite four', function (test) {

                console.log('testId:',test.testId,this.doggy);


                test.before(function (done) {

                    console.log('testId:',test.testId,this.doggy);
                    done();

                }).after(function (done) {

                    done();

                });

                test.it('makes stuff 18', function (done) {

                    done();
                });

                test.it('makes stuff 19', function (done) {

                    done();

                });

            });

        });

    });

    test.describe('suite five', function (test) {

        test.before(function (done) {


            done();

        }).after(function (done) {


            done();

        });

        test.it('makes stuff 20', function (done) {

            done();
        }).it('makes stuff 21', function (done) {

            done();
        }).it('makes stuff 22', function (done) {

            done();
        });

    });

});