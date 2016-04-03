const suman = require('../../lib');
var Test = suman.init(module);


Test.describe('@Test1', {parallel: true}, function () {

    this

        .it('one', t => {
            return promiseTimeout(t);
        })


        .it('two', t => {
            return promiseTimeout(t);
        })


        .it('three', t => {
            return promiseTimeout(t);
        })


        .it('four', (t) => {
            return promiseTimeout(t);
        })


        .it('five', t => {
            return promiseTimeout(t);
        })


        .it('four', (t) => {
            return promiseTimeout(t);
        })


        .it('five', t => {
            return promiseTimeout(t);
        });


});
