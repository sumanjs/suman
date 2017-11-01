#!/usr/bin/env node
var suman = require('suman');
var Test = suman.init(module).Test;
console.log('zoee');
Test.create('yolo', function (it) {
    it('maxxes out1', function (t) {
    });
    it('maxxes out2', function (t) {
    });
    it.cb('mokkoout2', function (t) {
        setTimeout(function () {
            t.done();
        }, 3);
    });
});
