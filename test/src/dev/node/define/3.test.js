#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_1 = require("suman");
var Test = suman_1.default.init(module);
Test.define(function (v) {
    v.desc('hi')
        .run(function (b, it) {
        it.parallel('hi', function (t) {
        });
    });
});
Test.define('hi')
    .source('semver', 'suit')
    .run(function (b) {
    var _a = b.getHooks(), it = _a.it, describe = _a.describe;
    var sourced = b.getSourced();
    console.log('sourced:', sourced);
    it.parallel('hi', function (t) {
    });
    describe('published', function (b) {
        5..times(function () {
            it('meta', function (t) {
            });
        });
    });
});
