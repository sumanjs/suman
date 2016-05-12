/**
 * Created by denman on 12/2/2015.
 */




/*var suman = require('../../lib');
 var Test = suman.new(module, 'suman.conf.js');


 Test.suite('suite tres', function (suite) {*/
var Test = require('../../lib').init(module, 'suman.conf.js');

Test.describe('suite tres', function (suite) {


    this.before.cb(t => {


        // t.done();


        return {};

    });


    this.it('my test99999', t => {


    });


    this.afterEach(t => {
        t.done();
    });


    this.describe('tarzan', function () {

        this.before(t => {

        });

        this.it('my tarzan test', function () {

        });

        this.describe('uuuuu test', function () {

            this.describe('uuuuu3333 test', function () {

                this.before.skip(t => {

                });

                // this.it.red('my 3333 test', function () {
                //
                // });

            });


            this.before(function () {

            });

            this.it('my boooz test', function () {

            });

        });

    });


});