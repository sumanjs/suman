/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite uno', function (test) {



    test.before(function (done) {

        //test.log('in before');
        done();

    }).after(function (done) {

        //test.log('in after 1');
        done();

    });


    test.it('makes stuff 1', function (done) {

        //test.log('1');
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        //test.log('2');
        done(new Error('barf 4'));

    });


    test.series([
        test.it('makes stuff 3', function () {

            //test.log('7777777777777');

        }),
        test.it('makes stuff 4', function (done) {

            //test.log('2222222222222222');
            done(new Error('barf 4'));

        })
    ]);


    test.loop(['5','6','7'], function (test, value) {

        test.it('makes stuff ' + value, function (done) {

            //test.log('1');
            done(new Error('barf 3'));

        });

    });


    test.parallel(function (test) {


        test.it('makes stuff 8', function (done) {

            //test.log('1');
            done(new Error('barf 3'));

        }).it('makes stuff 9', function () {

            //test.log('2');

        }).it('makes stuff 10', function (done) {

            //test.log('3');
            done(new Error('barf 5'));

        });


    });


    test.parallel(function (test) {


        test.it('makes stuff 11', function (done) {

            //test.log('1');
            done(new Error('barf 3'));

        });

        test.it('makes stuff 12', function (done) {

            //test.log('2');
            done(new Error('barf 4'));

        });

        test.it('makes stuff 13', function (done) {

            //test.log('3');
            done(new Error('barf 5'));

        });


    });


    test.after(function (done) {

        //test.log('in after 3');
        done();

    });


    test.describe('suite two', function (test) {

        test.before(function (done) {

            //test.log('in before dogs');
            done();

        }).after(function (done) {

            //test.log('in after 4');
            done();

        }).it('makes stuff 14', function (done) {
            //test.log('1');
            done();
        }).it('makes stuff 15', function (done) {
            //test.log('2');
            done();
        });



        test.describe('suite three', function (test) {

            test.before(function (done) {

                //test.log('in before cats 2');
                done();

            }).after(function (done) {

                //test.log('in after cats 3');
                done();

            });

            test.it('makes stuff 16', function (done) {
                //test.log('ccct 1');
                done();
            });

            test.it('makes stuff 17', function (done) {
                //test.log('ccct 2');
                done();
            });

            test.describe('suite four', function (test) {

                test.before(function (done) {

                    //test.log('in before cats 4');
                    done();

                }).after(function (done) {

                    //test.log('in after cats 5');
                    done();

                });

                test.it('makes stuff 18', function (done) {
                    //test.log('ccct 1');
                    done();
                });

                test.it('makes stuff 19', function (done) {
                    //test.log('ccct 2');
                    done();
                });

            });

        });

    });

    test.describe('suite five', function (test) {

        test.before(function (done) {

            //test.log('in before cats 6');
            done();

        }).after(function (done) {

            //test.log('in after cats 7');
            done();

        });

        test.it('makes stuff 20', function (done) {
            //test.log('ccct 1');
            done();
        }).it('makes stuff 21', function (done) {
            //test.log('ccct 2');
            done();
        }).it('makes stuff 22', function (done) {
            //test.log('ccct 2');
            done();
        });

    });

});