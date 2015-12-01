/**
 * Created by amills001c on 11/30/15.
 */



var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite 4', function (test) {


    test.before(function (done) {

        //test.log('before 1');
        //done(new Error('jarles'));

        done();
    });

    test.before(function (done) {

        //test.log('before 2');
        //throw new Error('marbles');
        done();

    });

    test.beforeEach(function (done) {

        //test.log('before Each 1');
        done();

    });

    test.beforeEach(function (done) {

        //test.log('before Each 2');
        done();

    });

    test.it('logs stuff 1', function () {

        //test.log('logging 1');
        //throw new Error('bad 1');

    });

    test.it('logs stuff 2', function () {

        //test.log('logging 2');
        //throw new Error('bad 2');

    });

    test.it('logs stuff 3', function (done) {

        //test.log('logging 3');
        //done(new Error('mike'));
        done();
    });

    test.describe('darth', function (test) {

        test.before(function (done) {

            //test.log('before 3');
            done();

        });

        test.it('sucks', function () {

        });


    });

    test.before(function (done) {

        //test.log('before 3');
        done();

    });

    test.beforeEach(function (done) {

        //test.log('beforeEach 3');
        done();

    });

    test.after(function (done) {

        //test.log('after');
        done();

    });

    test.afterEach(function (done) {

        //test.log('after each');
        done();

    });


});