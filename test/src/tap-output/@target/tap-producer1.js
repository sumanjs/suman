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
        throw new Error('whole me 3');
    })
        .it('rudolph', function (t) {
        throw new Error('whole me 4');
    })
        .afterEach('ram', function (h) {
    });
    after('b', function (h) {
        h.slow();
    });
});
