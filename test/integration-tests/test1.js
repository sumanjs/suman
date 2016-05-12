/*
 * created by Olegzandr Denman
 *
 * */

//context
//gwt


var suman = require('../../lib');

var Test = suman.init(module, {
    interface: 'BDD',
    integrants: ['smartconnect', 'dolce-vida']
});


Test.describe('suite uno', {}, function () {

    

    this.it.skip('foo2', {parallel: true}, t => {

    });


    this.it.cb('bar2', {parallel: false}, (t, done) => {
        done();
    });


    this.it('baz2', {parallel: true}, t => {

    });


    this.describe('suite five', {parallel: true}, function () {

        this.before(function () {

        }).after(() => {

        });

        this.it.cb('makes stuff 20', function (t, done) {

            setTimeout(function () {
                done();
            }, 10);

        });

        this.it('makes stuff 21', function () {


        });

        this.it('makes stuff 22', () => {

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


            this.before.cb((t, done) => {
                done();

            }).beforeEach(() => {


            }).after(() => {


            }).it.cb('makes stuff 18', (t, done) => {

                done();

            });

            this.it.cb('makes stuff 19', (t, done) => {

                done();

            }).afterEach(() => {


            });


        });

    });

});


