'use strict';

/*
 * */

var suman = require('../../lib');
var Test = suman.init(module, {
    export: true,
    interface: 'TDD',
    writable: suman.Writable()
});

Test.suite('@Test1', { parallel: false, bail: true }, function (assert, fs, path, stream, extra, writable) {

    writable._write = function (chunk, encoding, cb) {

        console.log(String(chunk));
    };

    writable.uncork();
    writable.end();
});