/*
 * */

//http://blog.yld.io/2016/01/13/using-streams/#.VwyjZZMrKXk

const suman = require('../../lib');
const Test = suman.init(module, {
    export: true,
    interface: 'TDD',
    writable: suman.Transform()
});


Test.suite('@Test1', {parallel: false, bail: true}, function (assert, fs, path, stream, extra, writable, delay) {


    const strm = new stream.Writable({

        write: function (chunk, encoding, cb) {
            console.log('whoooa:', String(chunk));
        }
    });

    writable.pipe(strm);

    // writable.uncork();

    strm.on('finish', delay);
    strm.on('end',delay);

});
