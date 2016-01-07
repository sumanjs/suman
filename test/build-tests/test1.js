/*
 * created by Olegzandr Denman
 *
 * */

//context
//gwt

var debug = require('debug')('suman:test');
var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('suite uno', function (suite) {


    this.before(function (done) {

        done();

    });


    this.it.skip('foo2', {
        parallel: false
    }, function () {

        debug('rooola');

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


 /*   this.loop(['5', '6', '7'], function (value) {

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


    });*/

    this.describe.skip('suite five', {
        parallel: true
    }, function () {


        this.before(function () {


        }).after(function () {


        }).it('makes stuff 20', function (done) {

            setTimeout(function () {

                //throw new Error('blooods');
                done();
            }, 1000);


        }).it.only('makes stuff 21', function () {


        }).it('makes stuff 22', function () {


        }).after(function () {


        })


    });

/*
    this.describe('suite two', function () {


        this.loop(['53', '63', '73'], function (value) {

            this.it('makes stuff ' + value, function () {


            });

        });

        this.describe('suite three', {
            parallel: true
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
    });*/

});


