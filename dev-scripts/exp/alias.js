"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let mySharedFn = function () {
};
class Foo {
    constructor() {
        this.bar = mySharedFn;
        this.aliasBar = mySharedFn;
    }
}
exports.Foo = Foo;
