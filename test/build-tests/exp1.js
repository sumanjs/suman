/**
 * Created by denman on 12/2/2015.
 */

var debug = require('debug')('suman:test');
var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('foo', function () {

    this.before(() => {
        debug('before 0');
    });


    this.after(() => {
        debug('after 0');
    });


    this.it('4', (t, done) => {

        setTimeout(function () {
            done();
        }, 1000);

    });

    this.beforeEach((t, done) => {

        debug('before each 1');
        done();

    });


    this.describe('2', function () {

        this.before(() => {
            debug('before 1');
        });


        this.describe('3', {parallel: true}, function () {


            this.beforeEach(t => {
                debug('before each 2');
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
                debug('this.after x');
            });

        });

        this.after(() => {
            debug('this.after y');
        });

    });

    this.after(() => {
        debug('this.after z');
    });


});