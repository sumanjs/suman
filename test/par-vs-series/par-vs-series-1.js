/**
 * Created by denmanm1 on 4/17/16.
 */


const suman = require('../../lib');
const Test = suman.init(module, {});

Test.describe('1', {mode: 'parallel'}, function () {


    this.it.cb('one', t => {

        setTimeout(function () {
            t.done();
        }, 2000);
    });

    this.it.cb('two', t => {

        setTimeout(function () {
            t.done();
        }, 2000);
    });

    this.it.cb('three', t => {

        setTimeout(function () {
            t.done();
        }, 2000);

    });

    this.it.cb('four', t => {

        setTimeout(function () {
            t.done();
        }, 2000);

    });

    this.it.cb('five', t => {

        setTimeout(function () {
            t.done();
        }, 2000);

    });


});