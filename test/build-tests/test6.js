

const suman = require('../../lib');
var Test = suman.init(module, {
    interface: 'TDD'
});


function promiseTimeout() {
    return new Promise(function (resolve) {
        setTimeout(function(){
            resolve(3);
        },100);
    });
}



Test.suite('@Test1', {parallel: false}, function () {

    this.setupTest(function () {

    });


    this.test('one', t => {
        return promiseTimeout(t);
    });


    this.suite('hello', {}, function () {


        this.test('two', t => {
            return promiseTimeout(t);
        });


        this.test('three', t => {
            return promiseTimeout(t);
        });


        this.test('four', (t) => {
            return promiseTimeout(t);
        });


        this.test('five', t => {
            return promiseTimeout(t);
        });

        this.suite(function () {

            this.test('four', (t) => {
                return promiseTimeout(t);
            });


            this.test('five', t => {
                return promiseTimeout(t);
            });

        });


    })


});
