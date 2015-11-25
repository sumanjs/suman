/**
 * Created by amills001c on 11/24/15.
 */


var describe = require('../lib/ntf').describe;


describe('suite uno', function (suite) {


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

    //suite.loop(testCases,function(done){
    //
    //
    //});
    //
    //

    suite.parallel(function (suite) {

        return [

            suite.it('makes stuff 1', function (done) {

                console.log('1');
                done(new Error('barf 3'));

            }),
            suite.it('makes stuff 2', function (done) {

                console.log('2');
                done(new Error('barf 4'));

            }),
            suite.it('makes stuff 3', function (done) {

                console.log('3');
                done(new Error('barf 5'));

            })
        ];

    });


    describe('suite two', function (suite) {

        suite.before(function (done) {

            console.log('in before dogs');
            done();

        }).after(function (done) {

            console.log('in after dogs');
            done();

        });

        suite.it('dogs 1', function (done) {
            console.log('1');
            done();
        });

        suite.it('dogs 2', function (done) {
            console.log('2');
            done();
        });

        describe('suite three', function (suite) {

            suite.before(function (done) {

                console.log('in before cats');
                done();

            }).after(function (done) {

                console.log('in after cats');
                done();

            });

            suite.it('cats 1', function (done) {
                console.log('ccct 1');
                done();
            });

            suite.it('cats 2', function (done) {
                console.log('ccct 2');
                done();
            });

        });

    });


});