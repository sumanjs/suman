'use strict';

/**
 * Created by denman on 5/10/2016.
 */

var test = require('ava');
var fs = require('fs');

function asyncFn(cb) {
    process.nextTick(function () {
        cb(null, null);
    });
}

test.cb(function (t) {
    asyncFn(function (err, res) {
        t.is(res.bar, 'ok');
        t.end();
    });
});