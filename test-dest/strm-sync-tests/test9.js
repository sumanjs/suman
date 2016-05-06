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

Test.suite('@Test1', {

    'async/await': true,
    parallel: false,
    bail: true

}, function (assert, fs, delay, path, stream, extra, writable) {
    var _this = this;

    var strm = new stream.Writable({

        write: function write(chunk, encoding, cb) {
            console.log('whoooa:', String(chunk));

            _this.test('yolo', function () {

                assert(true === true);
            });

            cb();
        }
    });

    writable.pipe(strm);

    // writable.uncork();

    strm.on('finish', delay);
    strm.on('end', delay);
});