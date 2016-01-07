/**
 * Created by denman on 1/3/2016.
 */


var debug = require('debug')('suman:test');
var suite = require('../../lib').Test(module, 'suman.conf.js');


suite.new('desc', function () {

    this.before(function () {

        debug('before');
    });

    var i = 1;

    this.beforeEach(function (d0) {

        debug('beforeEach:', this.currentTest.desc);

        this.currentTest.data.roger = i++;

        d0();

    });


    this.describe(function () {

        this.beforeEach(function (d1) {

            debug('beforeEach:', this.currentTest.desc);

            this.currentTest.data.roger = i++;

            d1();

        });

      /*  this.loop([1, 2, 3], function (val, index) {

            debug('index:', index);

            this.it('makes' + val, function (done) {

                debug(this.data);
                setTimeout(function () {
                    done();
                }, 2000);

            });

        });*/

        var self = this;

        [1,2,3].forEach(function(val){

            self.it('makes' + val, function (done) {

                debug(this.data);
                setTimeout(function () {
                    done();
                }, 2000);

            });
        });

        this.afterEach(function () {

            debug('afterEach:', this.currentTest);

            delete this.currentTest.data.roger;

        });

    });

    this.afterEach(function () {

        debug('afterEach data:', this.currentTest.data);

    });


});