const suman = require('../../lib');
const Test = suman.init(module, {});

Test.describe('root suite description', {}, function () {   // we define the root suite


    //note: we are in the context of the "root suite"

    const self = this;    // (avoid the self pattern in Suman tests, here for explanation only :)


    this.before(function *() {
        const bnans = yield new Promise(function(resolve){
            resolve('bananas')
        });
        console.log('bananas:', bnans);
        console.log('1', this === self); //true
    });


});