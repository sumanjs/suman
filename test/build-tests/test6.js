/**
 * Created by denman on 12/2/2015.
 */




var suman = require('../../index.js');
var Test = suman.new(module, 'suman.conf.js');


Test.suite('suite tres', function (suite) {


    this.before(function (done) {

        return done();

    });


    this.it('my test', function () {


    });



    this.afterEach(function (done) {

        done();

    });


    this.describe('tarzan', function () {


        this.before(function (done) {

            done();

        });

        this.it('my tarzan test', function () {


        });

        this.describe('uuuuu test', function () {

            this.describe('uuuuu3333 test', function () {


                this.before(function (done) {

                    done();

                });

                this.it('my 3333 test', function () {



                });

            });


            this.before(function () {



            });

            this.it('my boooz test', function () {



            });

        });

    });


});