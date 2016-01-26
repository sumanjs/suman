/**
 * Created by amills001c on 1/25/16.
 */


const Test = require('suman').Test(module, 'suman.conf.js');


Test.describe('BBB', function () {


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