'use strict';

/*
 * */

var suman = require('../../lib');

var Test = suman.init(module, {
    export: true,
    interface: 'TDD'
});

Test.suite('@Test1', { parallel: false, bail: true }, function (assert, fs, path, stream, delay, extra) {
    var _this = this;

    var expected = extra[0].expected;
    var strm = extra[0].strm;

    // strm.on('finish', function () {
    //     delay();
    // });

    strm.on('data', function (data) {

        _this.test('test', function () {
            assert('a' === 'a');
        });
    });

    strm.on('end', function () {
        delay();
    });

    strm.resume();
});