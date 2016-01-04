/**
 * Created by denman on 1/3/2016.
 */


var suite = require('../../lib').Test(module, 'suman.conf.js');


suite.new('desc', function () {

    this.before(function () {

        console.log('before');
    });

    var i = 1;

    this.beforeEach(function (d0) {

        console.log('beforeEach:', this.currentTest.desc);

        this.currentTest.data.roger = i++;

        d0();

    });


    this.describe(function () {

        this.beforeEach(function (d1) {

            console.log('beforeEach:', this.currentTest.desc);

            this.currentTest.data.roger = i++;

            d1();

        });

      /*  this.loop([1, 2, 3], function (val, index) {

            console.log('index:', index);

            this.it('makes' + val, function (done) {

                console.log(this.data);
                setTimeout(function () {
                    done();
                }, 2000);

            });

        });*/

        var self = this;

        [1,2,3].forEach(function(val){

            self.it('makes' + val, function (done) {

                console.log(this.data);
                setTimeout(function () {
                    done();
                }, 2000);

            });
        });

        this.afterEach(function () {

            console.log('afterEach:', this.currentTest);

            delete this.currentTest.data.roger;

        });

    });

    this.afterEach(function () {

        console.log('afterEach data:', this.currentTest.data);

    });


});