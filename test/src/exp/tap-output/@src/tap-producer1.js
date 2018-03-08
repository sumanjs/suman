"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module);
console.log('zoom');
Test.create(function (it, before, describe, beforeEach, afterEach, after) {
    before('yup', [function (h) {
            console.log('cocoa butter lol');
        }]);
    describe('ruby tuesday', function () {
    });
    it('zoom', function (t) {
    });
    it('rudolph', function (t) {
    });
    afterEach('ram', function (h) {
    });
    after('b', function (h) {
        h.slow();
    });
});
