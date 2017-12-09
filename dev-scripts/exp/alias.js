"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mySharedFn = function () {
};
var Foo = (function () {
    function Foo() {
        this.bar = mySharedFn;
        this.aliasBar = mySharedFn;
    }
    return Foo;
}());
exports.Foo = Foo;
