/**
 * Created by denman on 12/2/2015.
 */


var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.new('foo', function () {


    this.before(function () {

        console.log('this.before 0');
    });

    this.after(function () {

        console.log('this.after 0');
    });

    this.it('4', function (done) {

        console.log('4444444');

        setTimeout(function () {
            done();
        }, 1000);

    });

    this.beforeEach(function () {

        console.log('this.before each 1');

    });


    this.describe('2', function () {

        this.before(function () {

            console.log('this.before 1');
        });

        this.describe('3', {isParallel: true}, function () {

            this.beforeEach(function () {

                console.log('this.before each 2');

            });

            this.it('it 5555', function (done) {

                console.log('555 ff 555');

                setTimeout(function () {
                    done();
                }, 1000);


            });

            this.it('66666six', function (done) {

                console.log('66666');

                setTimeout(function () {
                    done();
                }, 1000);

            });


            this.after(function () {

                console.log('this.after x');
            });
        });

        this.after(function () {

            console.log('this.after y');
        });
    });

    this.after(function () {

        console.log('this.after z');
    });


});