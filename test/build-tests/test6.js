/**
 * Created by denman on 3/26/2016.
 */


import * as suman from 'suman';
const Test = suman.init(module);


Test.describe('Test uno', function (assert, fs) {

    this.it('[test] 1', async (t) => {


        const foo = await 3;
        const bar = await new Promise(function(resolve){
            resolve('7');
        });
        const baz = bar*foo;
        assert.equal(baz,21);


    });

    this.test('[test] 2', {parallel: true}, (t, fail, done, pass) => {

        fs.createReadStream(t.data).pipe(fs.createWriteStream('/dev/null')).on('error', fail).on('finish', pass);

    });


});