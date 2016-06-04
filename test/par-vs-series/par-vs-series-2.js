/**
 * Created by denmanm1 on 4/17/16.
 */



const suman = require('../../lib');

const Test = suman.init(module, {});

Test.describe('2', {parallel: true}, function () {


    this.it.cb('one', t => {
        setTimeout(t.done, 2000);
    });

    this.it.cb('two', t => {
        setTimeout(t.done, 2000);
    });

    this.it.cb('three', t => {
        setTimeout(t.done, 2000);
    });

    this.it.cb('four', t => {
        setTimeout(t.done, 2000);
    });

    this.it.cb('five', t => {
        setTimeout(t.done, 2000);
    });


});