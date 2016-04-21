"use strict";

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// collection of test files
var testFiles = [];

// Used to convert paths to find test files
var pathToModule = function pathToModule(path) {
    return path.replace(/^\/base\//, "../../").replace(/\.js$/, '');
};

// Loop over each file karma is aware of and check which are test file
(0, _keys2.default)(window.__karma__.files).forEach(function (file) {
    if (/\.spec\.js$/.test(file)) {
        testFiles.push(pathToModule(file));
    }
});

// The nitty gritty
requirejs.config({
    baseUrl: "/base/www/js/",

    paths: {
        // If you want to actually test your modules, you put those here.
        // Just like a standard requirejs config
    },

    deps: testFiles,

    // kickoff jasmine
    callback: window.__karma__.start
});