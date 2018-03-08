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
