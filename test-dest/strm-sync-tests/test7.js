'use strict';

/*
 * */

var suman = require('../../lib');
var stream = require('stream');

var tests = [];

var writable = new stream.Writable({

    write: function write(chunk, encoding, cb) {

        console.log('data =>', String(chunk));

        tests.push(function (assert) {
            assert('a' === 'a');
            console.log('whoa');
        });

        cb();
    },

    end: function end(data) {
        console.log('end was called with data=', data);
    }

});

writable.on('finish', function () {
    writable.finished = true;
});

var Test = suman.init(module, {
    export: true,
    interface: 'TDD',
    writable: writable
});

Test.suite('@Test1', { parallel: false, bail: true }, function (assert, fs, path, stream, extra) {
    var _this = this;

    tests.forEach(function (test) {

        _this.test('tests data', function () {

            test(assert);
        });
    });
});