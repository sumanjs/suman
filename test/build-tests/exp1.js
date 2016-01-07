/**
 * Created by denman on 12/2/2015.
 */

var debug = require('debug')('suman:test');
var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('foo', function () {

    this.before(function () {

        debug('this.before 0');
    });

    this.after(function () {

        debug('this.after 0');
    });

    this.it('4', function (done) {

        debug('4444444');

        setTimeout(function () {
            done();
        }, 1000);

    });

    this.beforeEach(function () {

        debug('this.before each 1');

    });


    this.describe('2', function () {

        this.before(function () {

            debug('this.before 1');
        });

        this.describe('3', {parallel: true}, function () {

            this.beforeEach(function () {

                debug('this.before each 2');

            });

            this.it('it 5555', function (done) {

                debug('555 ff 555');

                setTimeout(function () {
                    done();
                }, 1000);


            });

            this.it('66666six', function (done) {

                debug('66666');

                setTimeout(function () {
                    done();
                }, 1000);

            });


            this.after(function () {

                debug('this.after x');
            });
        });

        this.after(function () {

            debug('this.after y');
        });
    });

    this.after(function () {

        debug('this.after z');
    });


});