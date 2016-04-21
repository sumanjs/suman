'use strict';

/*
 * */

//http://blog.yld.io/2016/01/13/using-streams/#.VwyjZZMrKXk

var suman = require('../../lib');
var Test = suman.init(module, {
    export: true,
    interface: 'TDD',
    writable: suman.Transform()
});

Test.suite('@Test1', { parallel: false, bail: true }, function (assert, fs, path, stream, extra, writable, delay) {

    var strm = new stream.Writable({

        write: function write(chunk, encoding, cb) {
            console.log('whoooa:', String(chunk));
        }
    });

    writable.pipe(strm);

    // writable.uncork();

    strm.on('finish', delay);
    strm.on('end', delay);
});