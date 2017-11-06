'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var global = require('suman-browser-polyfills/modules/global');
var process = require('suman-browser-polyfills/modules/process');
var path = require("path");
var assert = require("assert");
var dashdash = require("dashdash");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var options = _suman.allSumanOptions = require('./suman-options');
var IS_SUMAN_DEBUG = process.env['SUMAN_DEBUG'] === 'yes';
if (module.parent && module.parent.filename === path.resolve(__dirname + '/../index')) {
    console.log(chalk.bgRed('lib/index has required this file first.'));
}
var opts, parser = dashdash.createParser({ options: options });
try {
    opts = parser.parse(process.argv);
}
catch (err) {
    console.error(chalk.red(' => Suman command line options error: %s'), err.message);
    console.error(' => Try "suman --help" or visit sumanjs.org');
    process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}
if (opts.help) {
    process.stdout.write('\n');
    var help = parser.help({ includeEnv: true }).trimRight();
    console.log('usage: suman [file/dir] [OPTIONS]\n\n'
        + chalk.magenta('options:') + '\n'
        + help);
    process.stdout.write('\n');
    process.exit(0);
}
if (opts.completion) {
    console.log('\n');
    console.log(chalk.cyan(' => The following output can be used for bash completion with the suman executable.'));
    console.log(chalk.cyan(' => However, not that this is already available by using suman-clis.sh.'));
    var bashCompletionData = dashdash.bashCompletionFromOptions({
        name: 'suman',
        options: options
    });
    console.log(bashCompletionData);
    process.exit(0);
}
if (opts.concurrency) {
    assert(typeof opts.concurrency === 'number', '--concurrency value must be a positive integer');
    assert(opts.concurrency !== 0, '--concurrency value must be a positive integer');
}
if (opts.fforce) {
    opts.force = true;
}
if (opts.per) {
    opts.watch_per = opts.per;
}
if (opts.debug_child && opts.inspect_child) {
    throw 'Please choose either "--debug-child" or "--inspect-child" option, they are exclusive.';
}
if (IS_SUMAN_DEBUG || opts.verbosity > 7) {
    console.log(' => Suman options:\n', opts);
    console.log(' => Suman arguments:\n', opts._args);
}
if (!Number.isInteger(opts.verbosity)) {
    console.error(' => [suman] => For whatever reason, opts.verbosity was not set by the CLI.');
    console.error(' => [suman] => We are manually setting it to the default value of 5.');
    opts.verbosity = 5;
}
module.exports = opts;
