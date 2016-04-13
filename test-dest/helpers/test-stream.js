'use strict';

/**
 * Created by amills001c on 4/9/16.
 */

var fs = require('fs');
var Stream = require('stream');
var assert = require('assert');

module.exports = function (expected) {

    var index = 0;

    var writable = new Stream.Writable({

        write: function write(chunk, encoding, cb) {

            var data = chunk.toString();
            if (this._lastLineData) {
                data = this._lastLineData + data;
            }

            var lines = data.split('\n');
            this._lastLineData = lines.splice(lines.length - 1, 1)[0];

            lines.forEach(function (line) {
                console.log('line:', line);
                var val = expected[index++];
                console.log('expected:', val);
                assert.equal(line, val);
            });

            cb();
        },

        end: function end(data) {
            console.log('end was called with data=', data);
        }

    });

    writable.on('finish', function () {
        console.log('finished');
    });

    writable.on('end', function () {
        console.log('end');
    });

    return writable;
};