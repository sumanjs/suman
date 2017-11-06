'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
module.exports = function (dirs) {
    console.log('\n');
    _suman.log.info(chalk.magenta.bold('No test files were found in the directories provided, ' +
        'given the following regular expressions => '), '\n\n', chalk.magenta([
        {
            matchAny: _suman.sumanMatchesAny
        },
        {
            matchNone: _suman.sumanMatchesNone
        },
        {
            matchAll: _suman.sumanMatchesAll
        }
    ].map(function (item) { return su.padWithXSpaces(4) + util.inspect(item); }).join('\n\n')));
    console.log('\n\n', chalk.gray.underline.bold('=> Suman searched the following dirs for test files that matched the above regex(es) =>') + '\n', dirs.map(function (d) { return '\t' + chalk.cyan.bold(' => "' + String(d) + '"'); }).join('\n'), '\n\n');
    console.log('\n', chalk.black.bold('=> No test files found. In this case, the default is to exit with code 34. '));
    console.log(chalk.black.bold(' => To allow Suman tests to "pass" even in this event, use the ' +
        chalk.magenta('"--exit-with-code-zero-if-no-test-files-matched"') + ' option, which is probably a bad idea.'), '\n');
    if (_suman.sumanOpts.recursive !== true) {
        console.log(chalk.yellow.bold(' => (note that the ' + chalk.magenta('"--recursive"') + ' option is not flagged to true => ' +
            'perhaps you intended to use this option to capture more tests?) '));
    }
    process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILES_MATCHED_OR_FOUND);
};
