"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_d_1 = require("suman-d");
exports.run = function (projectRoot, sumanLibRoot, opts) {
    var fn = suman_d_1.startSumanD(projectRoot, sumanLibRoot, opts || {});
};
