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
var Test = suman.new(module, 'suman.conf.js');


Test.suite('suite uno', function (suite) {


    this.before(function (done) {


        done();

    });


    //https://www.promisejs.org/patterns/


    this.it('foo', function () {

        //Test.given(function () {
        //
        //    return new Promise(function(resolve,reject){
        //        setTimeout(function(){
        //            resolve('0');
        //        },2);
        //    });
        //
        //}).when(function (data) {
        //
        //    console.log('data:',data);
        //    console.log('dawgs 2');
        //
        //    return Promise.resolve(4);
        //
        //}).then(function(){
        //
        //    console.log('dawgs 3');
        //
        //
        //}).then('monkeys');


    });


    this.it('bar', function () {


    }).it('baz', function () {


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

        this.it('makes stuff ' + value, function () {


        });

    });


    this.parallel(function () {


        this.it('makes stuff 8', function () {


        }).it('makes stuff 9', function () {


        }).it('makes stuff 10', function () {


        });


    });

    this.describe('suite five', function () {


        this.before(function () {


        }).after(function () {


        }).it('makes stuff 20', function () {


        }).it('makes stuff 21', function () {


        }).it('makes stuff 22', function () {


        }).after(function () {


        })


    });


    this.describe('suite two', function () {


        this.loop(['53', '63', '73'], function (value) {

            this.it('makes stuff ' + value, function () {


            });

        });

        this.describe('suite three', function () {


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


        this.describe('suite four', function () {


            this.before(function () {


            }).after(function () {


            }).it('makes stuff 18', function (done) {


                done();

            }).it('makes stuff 19', function (done) {


                done();

            });


        });
    });

});


