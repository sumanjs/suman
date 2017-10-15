"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_shell_1 = require("suman-shell");
exports.run = function (projectRoot, sumanLibRoot, opts) {
    var fn = suman_shell_1.startSumanShell(projectRoot, sumanLibRoot, opts || {});
    process.once('exit', fn);
};
