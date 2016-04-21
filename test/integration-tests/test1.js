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


Test.describe('suite uno', function () {

    this.it.skip('foo2', {parallel: true}, t => {

    });


    this.it('bar2', {parallel: false}, (t, done) => {
        done();
    });


    this.it('baz2', {parallel: true}, t => {

    });


    //this.loop(['5', '6', '7'], (value) => {
    //
    //    this.it.only('makes stuff ' + value, t => {
    //
    //
    //    });
    //
    //});
    //
    //this.loop([8, 9, 10], (value) => {
    //
    //    this.it('makes stuff ' + value, (t /*done*/) => {
    //
    //    });
    //
    //});


    //this.runParallel(function () {
    //
    //
    //    this.it('makes stuff 8', t => {
    //
    //    }).it('makes stuff 9', t => {
    //
    //
    //    }).it('makes stuff 10', t => {
    //
    //
    //    });
    //
    //
    //});


    this.describe('suite five', {

        parallel: true

    }, function () {

        this.before(function () {


        }).after(() => {


        });

        this.it('makes stuff 20', function (t, done) {

            setTimeout(function () {

                done();
            }, 10);


        });

        this.it('makes stuff 21', function () {


        }).it('makes stuff 22', () => {


            //console.log('this:',this);

        }).after(() => {


        });


    });

    this.describe('suite two', function () {


        this.describe('suite three', {

            parallel: true

        }, function () {


            this.before(function () {


            }).after(function () {


            });
            

            this.it('makes stuff 16', function () {


            });

            this.it('makes stuff 17', function () {


            });

        });


        this.describe('suite four', function () {


            this.before(done => {
                done();

            }).beforeEach(() => {


            }).after(() => {


            }).it('makes stuff 18', (t, done) => {

                done();

            });

            this.it('makes stuff 19', (t, done) => {

                done();

            }).afterEach(() => {


            });


        });

    });

});


