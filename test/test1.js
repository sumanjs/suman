/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite uno', function (test) {


    var red = 'turtle';


    test.before(function (done) {

        test.log('in before');
        console.log('in before red:',red);
        done();

    }).after(function (done) {

        test.log('in after 1');
        done();

    });


    test.it('makes stuff 1', function (done) {

        test.log('1');
        console.log('it:',red);
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        test.log('2');
        done(new Error('barf 4'));

    });


    test.series([
        test.it('makes stuff 2', function () {

            console.log('it series:',red);
            test.log('7777777777777');

        }),
        test.it('makes stuff 2', function (done) {

            console.log('it series:',red);
            test.log('2222222222222222');
            done(new Error('barf 4'));

        })
    ]);


    test.loop(['chard','heeee','raaa'], function (test, value) {

        test.it('makes stuff ' + value, function (done) {

            console.log('loop it series:',red);
            test.log('1');
            done(new Error('barf 3'));

        });

    });


    test.parallel(function (test) {


        test.it('makes stuff 1', function (done) {

            console.log('it parallel:',red);
            test.log('1');
            done(new Error('barf 3'));

        });

        test.it('makes stuff 2', function () {

            test.log('2');

        });

        test.it('makes stuff 3', function (done) {

            test.log('3');
            done(new Error('barf 5'));

        });


    });


    test.parallel(function (test) {


        test.it('makes stuff 44', function (done) {

            test.log('1');
            done(new Error('barf 3'));

        });

        test.it('makes stuff 888', function (done) {

            test.log('2');
            done(new Error('barf 4'));

        });

        test.it('makes stuff 999', function (done) {

            test.log('3');
            done(new Error('barf 5'));

        });


    });


    test.after(function (done) {

        test.log('in after 3');
        done();

    });


    test.describe('suite two', function (test) {

        test.before(function (done) {

            test.log('in before dogs');
            done();

        }).after(function (done) {

            test.log('in after 4');
            done();

        }).it('dogs 1', function (done) {
            test.log('1');
            done();
        }).it('dogs 2', function (done) {
            test.log('2');
            done();
        });



        test.describe('suite three', function (test) {

            test.before(function (done) {

                test.log('in before cats 2');
                done();

            }).after(function (done) {

                test.log('in after cats 3');
                done();

            });

            test.it('cats 1', function (done) {
                test.log('ccct 1');
                done();
            });

            test.it('cats 2', function (done) {
                test.log('ccct 2');
                done();
            });

            test.describe('suite four', function (test) {

                test.before(function (done) {

                    test.log('in before cats 4');
                    done();

                }).after(function (done) {

                    test.log('in after cats 5');
                    done();

                });

                test.it('cats 1', function (done) {
                    test.log('ccct 1');
                    done();
                });

                test.it('cats 2', function (done) {
                    test.log('ccct 2');
                    done();
                });

            });

        });

    });

    test.describe('suite five', function (test) {

        test.before(function (done) {

            test.log('in before cats 6');
            done();

        }).after(function (done) {

            test.log('in after cats 7');
            done();

        });

        test.it('cats 1', function (done) {
            test.log('ccct 1');
            done();
        });

        test.it('cats 2', function (done) {
            test.log('ccct 2');
            done();
        });

    });

});