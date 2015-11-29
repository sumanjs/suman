/**
 * Created by amills001c on 11/24/15.
 */


var suman = require('../index.js');
var Test = suman(module,'test/config/sumanConfig');


Test.suite('suite first', function (test) {


    test.before(function (done) {

        test.log('in before');
        done();

    }).after(function (done) {

        test.log('in after');
        done();

    });

    test.it('makes stuff 1', function (done) {

        test.log('1');
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        test.log('2');
        done(new Error('barf 4'));

    });


    test.describe('suite second', function (test) {

        test.before(function (done) {

            test.log('in before shark');
            done();

        }).after(function (done) {

            test.log('in after shark');
            done();

        });

        test.it('shark 1', function (done) {
            test.log('1');
            done();
        });

        test.it('shark 2', function (done) {
            test.log('2');
            done();
        });

        test.describe('suite three', function (test) {

            test.before(function (done) {

                test.log('in before deer');
                done();

            }).after(function (done) {

                test.log('in after deer');
                done();

            });

            test.it('deer 1', function (done) {
                test.log('ccct 1');
                done();
            });

            test.it('deer 2', function (done) {
                test.log('ccct 2');
                done();
            });

        });

    });


});