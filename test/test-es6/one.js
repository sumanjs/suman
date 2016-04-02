/**
 * Created by amills001c on 3/20/16.
 */


import * as suman from '../../lib';
const Test = suman.init(module);


Test.describe('a', function (assert, fs) {

    this.describe('b', function () {


        this.it('a', function (t, done) {


            done();
        });

        this.it('a', function (t) {

        });


    });


});