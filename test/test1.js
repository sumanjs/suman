/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var test = suman(module,'test/config/sumanConfig');


test.describe('suite uno', function (suite) {


    suite.before(function (done) {

        test.log('in before');
        done();

    }).after(function (done) {

        test.log('in after 1');
        done();

    });


    suite.it('makes stuff 1', function (done) {

        test.log('1');
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        test.log('2');
        done(new Error('barf 4'));

    });

    //suite.loop(testCases,function(done){
    //
    //
    //});

    suite.series([
        suite.it('makes stuff 2', function () {

            test.log('7777777777777');

        }),
        suite.it('makes stuff 2', function (done) {

            test.log('2222222222222222');
            done(new Error('barf 4'));

        })
    ]);


    suite.parallel(function (suite) {


        suite.it('makes stuff 1', function (done) {

            test.log('1');
            done(new Error('barf 3'));

        });

        suite.it('makes stuff 2', function () {

            test.log('2');

        });

        suite.it('makes stuff 3', function (done) {

            test.log('3');
            done(new Error('barf 5'));

        });


    }).after(function (done) {

        test.log('in after 2');
        done();

    });


    suite.parallel(function (suite) {


        suite.it('makes stuff 44', function (done) {

            test.log('1');
            done(new Error('barf 3'));

        });

        suite.it('makes stuff 888', function (done) {

            test.log('2');
            done(new Error('barf 4'));

        });

        suite.it('makes stuff 999', function (done) {

            test.log('3');
            done(new Error('barf 5'));

        });


    });

    suite.after(function (done) {

        test.log('in after 3');
        done();

    });

    test.describe('suite two', function (suite) {

        suite.before(function (done) {

            test.log('in before dogs');
            done();

        }).after(function (done) {

            test.log('in after 4');
            done();

        });

        suite.it('dogs 1', function (done) {
            test.log('1');
            done();
        });

        suite.it('dogs 2', function (done) {
            test.log('2');
            done();
        });

        test.describe('suite three', function (suite) {

            suite.before(function (done) {

                test.log('in before cats');
                done();

            }).after(function (done) {

                test.log('in after cats 3');
                done();

            });

            suite.it('cats 1', function (done) {
                test.log('ccct 1');
                done();
            });

            suite.it('cats 2', function (done) {
                test.log('ccct 2');
                done();
            });

        });

    });


});