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

var readable = new stream.Readable({

    read: function read(size) {
        var data;
        if (data = dataSource[index++]) {
            this.push(data);
        } else {
            this.push(null);
        }
    }

});

readable.setEncoding('utf8');

// readable.on('data', (chunk) => {
//     console.log('got %d bytes of data', chunk.length, String(chunk));
// });

// readable.pause();

var test = require('./test7');

readable.pipe(test);