#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const async = require('async');
async.series({
    one: function () {
        return __awaiter(this, void 0, void 0, function* () {
            let x = yield 1;
            return x;
        });
    },
    two: function () {
        return __awaiter(this, void 0, void 0, function* () {
            let x = yield 2;
            return x;
        });
    }
}, function (err, results) {
    if (err) {
        throw err;
    }
    console.log('results =>', results);
});
