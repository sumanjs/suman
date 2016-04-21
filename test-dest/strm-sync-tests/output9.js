'use strict';

// const suman = require('../../lib');
//
//
// var Test = suman.init(module, {
//     interface: 'TDD'
// });

var fs = require('fs');
var stream = require('stream');

var index = 0;
var dataSource = ['1', '2', '3'];

var timeout = 1500;

var readable = new stream.Readable({

    read: function read(size) {
        var _this = this;

        setTimeout(function () {
            var data;
            if (data = dataSource[index++]) {
                _this.push(data);
            } else {
                _this.push(null);
            }
        }, timeout += 1000);
    }

});

readable.setEncoding('utf8');

readable.on('data', function (chunk) {
    console.log('got %d bytes of data', chunk.length, String(chunk));
});

// readable.pause();

var test = require('./test9');

readable.pipe(test);