/**
 * Created by denman on 1/3/2016.
 */


var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.describe('desc', function () {

    this.before(function () {
        debug('before');
    });

    var i = 1;

    this.beforeEach(function (t) {
        debug('beforeEach:', t.desc);
    });


    this.describe(function () {

        this.beforeEach(function (t) {

            debug('beforeEach:', t.desc);

        });

    /*    this.describe(function(){

            this.loop([1, 2, 3], function (val, index) {

                this.it('makes' + val, function (t, done) {

                    setTimeout(function () {
                        done();
                    }, 500);

                });

            });

        });*/

        this.describe(function(){

            this.loop([1, 2, 3], function (val, index) {

                this.it('makes' + val, function (t) {

                    return Promise.resolve(3);

                });

            });

        });



        this.describe(function(){
            var self = this;

            [1, 2, 3].forEach(function (val) {

                self.it('makes' + val, function (t) {

                    return Promise.all([
                        new Promise(function (resolve) {
                            resolve('bob');
                        }),
                        new Promise(function (resolve) {
                            resolve('woody');
                        })
                    ]).then(function(){
                        throw new Error('mike');
                    });

                });
            });
        });



        this.afterEach(function (t) {

            debug('afterEach:', t);
            delete t.data;

        });

    });

    this.afterEach(function (t) {

        debug('afterEach data:', t.data);

    });


});