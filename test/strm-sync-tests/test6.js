/*
 * */

const suman = require('../../lib');

const Test = suman.init(module, {
    export: true,
    interface: 'TDD'
});


Test.suite('@Test1', {parallel: false, bail: true}, function (assert, fs, path, stream, delay, extra) {


    const expected = extra[0].expected;
    const strm = extra[0].strm;

    // strm.on('finish', function () {
    //     delay();
    // });

    
    strm.on('data', (data)=> {

        this.test('test', function () {
            assert('a' === 'a');
        });

    });

    strm.on('end', function () {
        delay();
    });

    strm.resume();

    

});
