/**
 * Created by denman on 12/2/2015.
 */


var suman = require('../../lib');
const Test = suman.init(module);

const should = require('should');

Test.describe('suite tres', {}, function (assert) {

    this.before.cb(t => {

         t.done();
         t.log('barf');
    });


    this.it('my test99999', t => {


    });


    this.afterEach.cb({fatal: false}, t => {

        setTimeout(function(){

            var user = {
                name: 'tj',
                pets: ['tobi', 'loki', 'jane', 'bandit']
            };

            user.should.have.property('name', 'tjx');

            t.done();
        });

    });


    this.afterEach.cb({fatal: false},t => {

        setTimeout(t.wrap(function(){

            assert(false);
            t.done();
        }));

    });


    this.describe('tarzan', function () {

        this.before(t => {

            console.log(t);

        });

        this.it('my tarzan test', t => {

            console.log(t);

        });

        this.describe('uuuuu test', function () {

            this.describe('uuuuu3333 test', function () {

                this.before.skip(t => {

                });

                // this.it.red('my 3333 test', function () {
                //
                // });

            });


            this.before(function () {

            });

            this.it('my boooz test', function () {

            });

        });

    });


});