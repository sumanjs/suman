"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module);
Test.create(function (it) {
    it('passes', function (t) {
        throw new Error('whole me 1');
    });
    it.cb('fails', function (t) {
        throw new Error('whole me 2');
        setTimeout(function () {
            t.done();
        }, 1000);
    });
});
