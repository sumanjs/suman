"use strict";
exports.__esModule = true;
var suman_1 = require("suman");
var Test = suman_1["default"].init(module).Test;
Test.create('age', function (b) {
    var _a = b.getHooks(), after = _a.after, it = _a.it, describe = _a.describe;
    it('foo', function (t) {
    });
    describe('age', function (b) {
    });
});
Test.define('foo').source('boo').run(function (b) {
    var c = b.getSourced();
    var d = b.getSourcedValue('boo');
    console.log(c);
    console.log(d);
});
