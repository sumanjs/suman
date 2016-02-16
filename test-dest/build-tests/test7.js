/**
 * Created by denman on 1/2/2016.
 */

var debug = require('debug')('suman');

const Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('BBB', function () {

    this.before(() => {}).beforeEach(() => {});

    this.describe('1', { efa: true }, function () {

        this.before(done => {

            setTimeout(function () {
                done();
            }, 10);
        });

        this.it('[test] yo', { parallel: false }, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);
        });

        this.it('yo', { parallel: false }, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);
        });

        this.it({ parallel: false }, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);
        });
    });

    this.before(() => {});
});

/*


Test.describe('BBB2', function () {


    this.before(() => {


    }).beforeEach(() => {


    });


    this.describe('1', {efa: true}, function () {

        this.before((done) => {

            setTimeout(function () {
                done();
            }, 10);
        });

        this.it('[test] yo', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it('yo', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it({parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });


    });


    this.before(() => {

    });


});


Test.describe('BBB2', function () {


    this.before(() => {


    }).beforeEach(() => {


    });


    this.describe('1', {efa: true}, function () {

        this.before((done) => {

            setTimeout(function () {
                done();
            }, 10);
        });

        this.it('[test] yo', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it('yo', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it({parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });


    });


    this.before(() => {

    });


});
*/

module.exports.wait = false;