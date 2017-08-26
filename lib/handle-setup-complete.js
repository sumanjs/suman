'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var suman_constants_1 = require("../config/suman-constants");
exports.handleSetupComplete = function (test, type) {
    if (test.isSetupComplete) {
        _suman.logError('Illegal registry of block method type => "' + type + '()".');
        _suman.logError(chalk.red.bold('Suman usage error => fatal => Asynchronous registry of test suite methods. Fatal AF.'), '\n\n');
        var e = new Error('Suman usage error => Fatal error => You have attempted to register calls to a\n' +
            'test suite block that has already finished registering hooks, test cases and child blocks.\n' +
            'To be more exact, one of two things happened: Either (1) ' +
            'You referenced a parent suite block inside a\nchild suite block by accident, or more likely (2) you called registry' +
            ' functions asynchronously.\n' +
            '\nYou cannot call the following functions asynchronously - describe(), it(), ' +
            'before(), beforeEach(), after(), afterEach()\n- do not ' +
            'put these calls inside a setTimeout, setImmediate, process.nextTick or any other asynchronous calls.\n' +
            ' *** !! This includes nesting these calls inside each other. !! ***\n\t' +
            '\nThis is a fatal error because behavior will be completely indeterminate upon asynchronous ' +
            'registry of these calls.');
        _suman.sumanRuntimeErrors.push(e);
        e.sumanFatal = true;
        e.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS;
        e.stack = String(e.stack).split('\n').filter(function (line) {
            return !/\/node_modules\//.test(line) && !/\/next_tick.js/.test(line);
        })
            .join('\n');
        if (test) {
            _suman.logError('Regarding the following test suite with name =>', util.inspect(test.title || test.desc));
        }
        throw e;
    }
};
