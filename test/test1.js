/*
* created by Olegzandr Denman
*
* */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite uno', (suite) => {


    this.before(function (done) {


        done();

    }).it('foo', function () {


    }).it('bar', function () {


    }).it('baz', function () {


    });


    this.loop(['5', '6', '7'], function (value) {

        this.it('makes stuff ' + value, function () {


        });

    });

    this.loop([8, 9, 10], (value) => {

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


        this.before(() => {


        }).after(() => {


        }).it('makes stuff 20', () => {


        }).it('makes stuff 21', () => {


        }).it('makes stuff 22', () => {


        }).after(() => {


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


        this.describe('suite four', () => {


            this.before(function () {


            }).after(function () {


            }).it('makes stuff 18', (done) => {


                done();

            }).it('makes stuff 19', (done) => {


                done();

            });

        });

    });

});


