/**
 * Created by amills001c on 11/24/15.
 */


var describe = require('../lib/ntf').describe;


describe('suite first', function (suite) {


    suite.before(function (done) {

        console.log('in before');
        done();

    }).after(function (done) {

        console.log('in after');
        done();

    });

    suite.it('makes stuff 1', function (done) {

        console.log('1');
        done(new Error('barf 3'));

    }).it('makes stuff 2', function (done) {

        console.log('2');
        done(new Error('barf 4'));

    });


    describe('suite second', function (suite) {

        suite.before(function (done) {

            console.log('in before shark');
            done();

        }).after(function (done) {

            console.log('in after shark');
            done();

        });

        suite.it('shark 1', function (done) {
            console.log('1');
            done();
        });

        suite.it('shark 2', function (done) {
            console.log('2');
            done();
        });

        describe('suite three', function (suite) {

            suite.before(function (done) {

                console.log('in before deer');
                done();

            }).after(function (done) {

                console.log('in after deer');
                done();

            });

            suite.it('deer 1', function (done) {
                console.log('ccct 1');
                done();
            });

            suite.it('deer 2', function (done) {
                console.log('ccct 2');
                done();
            });

        });

    });


});