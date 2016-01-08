/*
 * created by Olegzandr Denman
 *
 * */

//context
//gwt

var debug = require('debug')('suman:test');
var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('suite uno', function () {


    this.before((t, done) => {
        done();
    });


    this.it.skip('foo2', {
            parallel: false
        }, t => {

            debug('rooola');
        })


        .it.skip('bar2', {
            parallel: true
        }, (t, done) => {

            done();

        })


        .it('baz2', {
            parallel: true
        }, t => {

        });


    //this['@When']('dogs',function(){
    //
    //
    //
    //});


    this.loop(['5', '6', '7'], (value) => {

        this.it('makes stuff ' + value, t => {


        });

    });

    this.loop([8, 9, 10], (value) => {

        this.it('makes stuff ' + value, (t, done) => {

            done();

        });

    });


    this.runParallel(function () {


        this.it('makes stuff 8', t => {

            //throw new Error('yo1');


        }).it('makes stuff 9', t => {

            //throw new Error('yo2');


        }).it('makes stuff 10', t => {


        });


    });


    this.describe.skip('suite five', {

        parallel: true

    }, () => {


        this.before(() => {


        }).after(() => {


        }).it('makes stuff 20', function (done) {

            setTimeout(function () {

                //throw new Error('blooods');
                done();
            }, 1000);


        }).it.only('makes stuff 21', () => {


        }).it('makes stuff 22', () => {


        }).after(() => {


        });


    });

    this.describe('suite two', function () {


        this.loop(['53', '63', '73'], (value) => {

            this.it('makes stuff ' + value, () => {


            });

        });

        this.describe('suite three', {

            parallel: true

        }, () => {


            this.before(function () {


            }).after(function () {


            });

            this.loop(['59', '69', '79'], function (value) {

                this.it('makes stuff ' + value, () => {


                });

            });

            this.it('makes stuff 16', function () {


            });

            this.it('makes stuff 17', function () {


            });

        });


        this.describe.only('suite four', () => {


            this.before(() => {


            }).beforeEach(() => {


            }).after(() => {


            }).it('makes stuff 18', (t, done) => {

                done();

            }).it('makes stuff 19', (t, done) => {

                done();

            }).afterEach(() => {


            });


        });
    });

});


