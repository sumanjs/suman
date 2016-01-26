/**
 * Created by amills001c on 1/25/16.
 */


const Test = require('suman').Test(module, 'suman.conf.js');


Test.describe('@a-test', function () {


    this.before(() => {


    }).beforeEach(() => {


    });


    this.describe('1', {parallel: true}, function () {

        this.before((done) => {

            setTimeout(function () {
                done();
            }, 10);
        });

        this.it('yo', {}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it('yo', {}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });

        this.it({}, (t, done) => {

            setTimeout(function () {
                done();
            }, 500);

        });


    });


    this.before(() => {

    });


});