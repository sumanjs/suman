const suman = require('../../lib');
var Test = suman.init(module, {
    interface: 'TDD'
});


function promiseTimeout() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(3);
        }, 100);
    });
}


Test.suite('@Test1-TDD', {parallel: false, bail: true}, function () {


    this.setupTest(function () {

    });

    this.teardownTest(function(){

    });

    this.setup(function(){

    });

    this.teardown(function(){


    });

    
    this.series(function(test){

        return [
            
            test('makes rain', {}, function(){

                
            }),

            test('makes rain', {}, function(){

                
            })


        ]

    });
    
    

    this.test('one', t => {
        return promiseTimeout(t);
    });


    this.suite.skip('hello', {}, function () {


        this.test('two');


        this.test('three', t => {
            return promiseTimeout(t);
        });


        this.test('four', (t) => {
            return promiseTimeout(t);
        });


        this.test('five', t => {
            throw new Error('fools');
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
