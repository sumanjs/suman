/*
 * created by Olegzandr Denman
 *
 * */


var suman = require('../../lib');

var Test = suman.init(module, {
    interface: 'BDD',
    integrants: ['smartconnect', 'dolce-vida']
});


Test.describe('suite uno', {}, function () {


    this.it.skip.cb('foo2', {parallel: true}, t => {
        t();
    });


    this.it.cb('bar2', {parallel: false}, t => {
        t.done();
    });


    this.it('baz2', {parallel: true}, t => {

    });


    this.describe('suite five', {parallel: true}, function () {

        this.before(function () {

        }).after(() => {

        });

        this.it.cb('makes stuff 20', t => {

            setTimeout(function () {
                t.done();
            }, 10);

        });

        this.it('makes stuff 21', t => {


        });

        this.it('makes stuff 22', t => {

            //console.log('this:',this);

        }).after(() => {


        });


    });

    this.describe('suite two', function () {

        this.describe('suite three', {parallel: true}, function () {

            this.before(function () {

            }).after(function () {

            });


            this.it('makes stuff 16', function () {

            });

            this.it('makes stuff 17', function () {

            });

        });


        this.describe('suite four', function () {


            this.before.cb(t => {
                t.done();

            }).beforeEach(() => {


            }).after(() => {


            }).it.cb('makes stuff 18', t => {

                t.done();

            });

            this.it.cb('makes stuff 19', t => {

                t.done();

            }).afterEach(() => {


            });


        });

    });

});


