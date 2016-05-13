'use strict';

var suman = require('../../lib');
var Test = suman.init(module, {});

console.log('Filename:', Test.file);

Test.describe('Zulu', { parallel: true }, function () {

    this.beforeEach.cb(function (t) {
        setTimeout(function () {
            console.log('before each ' + t.desc);
            t.done();
        }, 1000);
    });

    this.it.cb('val', {}, function (t) {

        setTimeout(function () {
            t.done();
        }, 1000);
    });

    this.it.cb('foo', function (t) {

        setTimeout(function () {
            t.done();
        }, 2000);
    });

    this.it.cb('zam', function (t) {

        setTimeout(function () {
            t.done();
        }, 3000);
    });
});