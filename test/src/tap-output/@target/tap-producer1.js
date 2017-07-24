"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module);
Test.create(function (it, before, describe, beforeEach, afterEach, after) {
    before('yup', [function (h) {
        }]);
    describe('ruby tuesday', function () {
    });
    it('zoom', function (t) {
        t.assert.deepEqual(false, true);
    });
    it('fails', suman_1.default.autoPass)
        .afterEach('ram', function (h) {
    });
    after('b', function (h) {
        h.slow();
    });
});
