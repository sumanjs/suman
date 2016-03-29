/**
 * Created by denman on 3/26/2016.
 */


import * as suman from '../../lib';
const Test = suman.init(module, {

});


Test.describe('Test uno', function () {

    this.it('is a test', async (t, done, fail, pass) => {
        

        const foo = await 3;
        const bar = await new Promise(function(resolve){
            resolve('7');
        });
        const baz = bar*foo;
        console.log(baz);


    });


});