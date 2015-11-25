/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var test = suman(module,'test/config/sumanConfig');


test.describe('suite first', function (suite) {


    suite.before(function (done) {

        test.log('in before');
        done();

    }).after(function (done) {

        test.log('in after');
        done();

    });

    suite.it('makes stuff 1', function (done) {

        test.log('1');
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        test.log('2');
        done(new Error('barf 4'));

    });


    test.describe('suite second', function (suite) {

        suite.before(function (done) {

            test.log('in before shark');
            done();

        }).after(function (done) {

            test.log('in after shark');
            done();

        });

        suite.it('shark 1', function (done) {
            test.log('1');
            done();
        });

        suite.it('shark 2', function (done) {
            test.log('2');
            done();
        });

        test.describe('suite three', function (suite) {

            suite.before(function (done) {

                test.log('in before deer');
                done();

            }).after(function (done) {

                test.log('in after deer');
                done();

            });

            suite.it('deer 1', function (done) {
                test.log('ccct 1');
                done();
            });

            suite.it('deer 2', function (done) {
                test.log('ccct 2');
                done();
            });

        });

    });


});