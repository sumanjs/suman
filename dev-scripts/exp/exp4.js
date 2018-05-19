#!/usr/bin/env node
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const suman = require('suman');
const { Test } = suman.init(module, {
    forceParallel: true
});
const async = require('async');
let count = 0;
async.series({
    a: function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield 300;
            return 5;
        });
    }
}, function (err, results) {
    if (err) {
        throw err;
    }
    console.log('results => ', results);
    Test.create(function (b, test) {
    });
});
