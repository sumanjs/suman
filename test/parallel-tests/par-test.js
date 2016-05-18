const suman = require('../../lib');
const Test = suman.init(module, {});


console.log('Filename:', Test.file);

Test.describe('Zulu', {parallel: true}, function () {


    this.beforeEach.cb(t => {
        setTimeout(function () {
            console.log('before each ' + t.desc);
            t.done();
        }, 1000);
    });


    this.it.cb('val', {}, t => {

        setTimeout(function () {
            t.done();
        }, 1000);

    });

    this.it.cb('foo', t => {

        setTimeout(function () {
            t.done();
        }, 2000);
    });


    this.it.cb('zam', t => {

        setTimeout(function () {
            t.done();
        }, 3000);
    });

});
