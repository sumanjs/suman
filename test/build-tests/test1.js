/*
 * created by Olegzandr Denman
 *
 * */

//context
//gwt

//
//var suman = require('../index.js');
//var Test = suman.make(module, 'test/config/sumanConfig');
//
//
//Test.createSuite('suite uno', function (suite) {

var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('suite uno', function (suite) {


    this.before(function (done) {

        //throw new Error('rah');

        //throw new Error('agaege');
        done();

    });


    //https://www.promisejs.org/patterns/

    //this.it('moo', {
    //    parallel:false
    //},function () {
    //
    //    console.log('rooola');
    //
    //});

    this.it.skip('foo2', {
        parallel: false
    }, function () {

        console.log('rooola');

    });


    this.it.skip('bar2', {
        parallel: true
    }, function (done) {


        done();

    }).it('baz2', {
        parallel: true
    }, function () {

        //throw new Error('agaege');
    });

    //this['@When']('dogs',function(){
    //
    //
    //
    //});


    this.loop(['5', '6', '7'], function (value) {

        this.it('makes stuff ' + value, function () {


        });

    });

    this.loop([8, 9, 10], function (value) {

        this.it('makes stuff ' + value, function (done) {

            done();

        });

    });


    this.parallel(function () {


        this.it('makes stuff 8', function () {


        }).it('makes stuff 9', function () {


        }).it('makes stuff 10', function () {


        });


    });

    this.describe.skip('suite five', {
        isParallel: true
    }, function () {


        this.before(function () {


        }).after(function () {


        }).it.skip('makes stuff 20', function (done) {

            setTimeout(function () {
                done();
            }, 5000);


        }).it.only('makes stuff 21', function () {


        }).it('makes stuff 22', function () {


        }).after(function () {


        })


    });


    this.describe('suite two', function () {


        this.loop(['53', '63', '73'], function (value) {

            this.it('makes stuff ' + value, function () {


            });

        });

        this.describe('suite three', {
            isParallel: true
        }, function () {


            this.before(function () {


            }).after(function () {


            });

            this.loop(['59', '69', '79'], function (value) {


                this.it('makes stuff ' + value, function () {


                });

            });

            this.it('makes stuff 16', function () {


            });

            this.it('makes stuff 17', function () {


            });

        });


        this.describe.only('suite four', function () {


            this.before(function () {


            }).beforeEach(function () {


            }).after(function () {


            }).it('makes stuff 18', function (done) {

                done();

            }).it('makes stuff 19', function (done) {

                done();

            }).afterEach(function () {


            });


        });
    });

});


