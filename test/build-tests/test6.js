/**
 * Created by denman on 3/26/2016.
 */


const suman = require('../../lib');
const Test = suman.init(module);


Test.describe('Test uno', function () {

    debugger;

    this.it('is a test', async function (t, done, fail, pass) {

        const foo = await 3;
        const bar = await new Promise(function(resolve){
            resolve('7');
        });
        const baz = bar*foo;
        console.log(baz);


    });


});