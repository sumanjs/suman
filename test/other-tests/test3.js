/**
 * Created by denman on 12/2/2015.
 */


var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('foo', function () {

    this.before(() => {

    });


    this.after(() => {

    });


    this.it('4', (t, done) => {

        setTimeout(function () {
            done();
        }, 1000);

    });

    this.beforeEach((t, done) => {

        done();

    });


    this.describe('2', function () {

        this.before(() => {

        });


        this.describe('3', {parallel: true}, function () {


            this.beforeEach(t => {

            });

            this.it('it 5555', (t, done) => {

                setTimeout(function () {
                    done();
                }, 1000);

            });

            this.it('66666six', (t, done) => {

                setTimeout(function () {
                    done();
                }, 1000);

            });

            this.after(() => {

            });

        });

        this.after(() => {

        });

    });

    this.after(() => {

    });


});