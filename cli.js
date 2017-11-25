#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
debugger;
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var isLogExitCallable = true;
var logExit = function (code) {
    if (isLogExitCallable) {
        isLogExitCallable = false;
        console.log('\n');
        console.log(' => Suman cli exiting with code: ', code);
        console.log('\n');
    }
};
process.once('exit', function (code) {
    if (!global.__suman || !global.__suman.isActualExitHandlerRegistered) {
        logExit(code);
    }
});
if (require.main !== module && process.env.SUMAN_EXTRANEOUS_EXECUTABLE !== 'yes') {
    console.log('Warning: attempted to require Suman index.js but this cannot be.\n' +
        'Set the SUMAN_EXTRANEOUS_EXECUTABLE env variable to "yes" to get around this.');
    process.exit(1);
}
else {
    delete process.env['SUMAN_EXTRANEOUS_EXECUTABLE'];
}
function handleExceptionsAndRejections() {
    if (_suman && _suman.sumanOpts && (_suman.sumanOpts.ignore_uncaught_exceptions || _suman.sumanOpts.ignore_unhandled_rejections)) {
        console.error('\n => uncaughtException occurred, but we are ignoring due to the ' +
            '"--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" flag(s) you passed.');
    }
    else {
        console.error('\n => Use "--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" ' +
            'to force suman to continue despite the error.');
        process.exit(59);
    }
}
process.on('uncaughtException', function (err) {
    debugger;
    if (typeof err !== 'object') {
        console.error(new Error("err passed to uncaughtException was not an object => " + err).stack);
        err = new Error(typeof err === 'string' ? err : util.inspect(err));
    }
    if (String(err.stack || err).match(/Cannot find module/i) && _suman && _suman.sumanOpts && _suman.sumanOpts.transpile) {
        console.log(' => If transpiling, you may need to transpile your entire test directory to the destination directory using the ' +
            '--transpile and --all options together.');
    }
    setTimeout(function () {
        if (err && !err._alreadyHandledBySuman) {
            err._alreadyHandledBySuman = true;
            console.error('\n => Suman "uncaughtException" event occurred =>\n', chalk.magenta(err.stack), '\n\n');
            handleExceptionsAndRejections();
        }
    }, 500);
});
process.on('unhandledRejection', function (err, p) {
    debugger;
    if (typeof err !== 'object') {
        console.error(new Error("err passed to unhandledRejection was not an object => '" + err + "'").stack);
        err = new Error(typeof err === 'string' ? err : util.inspect(err));
    }
    setTimeout(function () {
        if (err && !err._alreadyHandledBySuman) {
            err._alreadyHandledBySuman = true;
            console.error('\n\n => Suman "unhandledRejection" event occurred =>\n', (err.stack || err), '\n\n');
            handleExceptionsAndRejections();
        }
    }, 500);
});
var path = require("path");
var util = require("util");
var assert = require("assert");
var EE = require("events");
var semver = require("semver");
var dashdash = require('dashdash');
var chalk = require("chalk");
var su = require("suman-utils");
var _ = require("lodash");
var uniqBy = require('lodash.uniqby');
var events = require('suman-events').events;
var JSONStdio = require("json-stdio");
var _suman = global.__suman = (global.__suman || {});
require('./lib/helpers/add-suman-global-properties');
require('./lib/patches/all');
var load_reporters_1 = require("./lib/helpers/load-reporters");
var suman_constants_1 = require("./config/suman-constants");
var general = require("./lib/helpers/general");
if (su.weAreDebugging) {
    _suman.log.info(' => Suman is in debug mode (we are debugging).');
    _suman.log.info(' => Process PID => ', process.pid);
}
if (su.vgt(6)) {
    _suman.log.info(chalk.magenta(' => Suman started with the following command:'), chalk.bold(util.inspect(process.argv)));
    _suman.log.info("NODE_PATH env var is as follows: '" + process.env['NODE_PATH'] + "'");
}
_suman.log.info('Resolved path of Suman executable =>', '"' + __filename + '"');
var nodeVersion = process.version;
var oldestSupported = suman_constants_1.constants.OLDEST_SUPPORTED_NODE_VERSION;
if (semver.lt(nodeVersion, oldestSupported)) {
    _suman.log.error(chalk.red('warning => Suman is not well-tested against Node versions prior to ' +
        oldestSupported + '; your Node version: ' + chalk.bold(nodeVersion)));
    throw 'Please upgrade to a Node.js version newer than v6.0.0. Suman recommends usage of NVM.';
}
_suman.log.info('Node.js version:', chalk.bold(nodeVersion));
var sumanLibRoot = _suman.sumanLibRoot = String(__dirname);
var pkgJSON = require('./package.json');
var sumanVersion = process.env.SUMAN_GLOBAL_VERSION = pkgJSON.version;
_suman.log.info(chalk.italic('Suman ' + chalk.bold('v' + sumanVersion) + ' running...'));
_suman.log.info('[process.pid] => ', process.pid);
_suman.startTime = Date.now();
var cwd = process.cwd();
var sumanExecutablePath = _suman.sumanExecutablePath = process.env.SUMAN_EXECUTABLE_PATH = __filename;
var sumanOpts = _suman.sumanOpts = require('./lib/parse-cmd-line-opts/parse-opts');
var viaSuman = _suman.viaSuman = true;
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var configPath = sumanOpts.config;
var serverName = sumanOpts.server_name;
var convert = sumanOpts.convert_from_mocha;
var src = sumanOpts.src;
var dest = sumanOpts.dest;
var init = sumanOpts.init;
var uninstall = sumanOpts.uninstall;
var force = sumanOpts.force;
var fforce = sumanOpts.fforce;
var s = sumanOpts.server;
var tailRunner = sumanOpts.tail_runner;
var tailTest = sumanOpts.tail_test;
var useBabel = sumanOpts.use_babel;
var useServer = sumanOpts.use_server;
var tail = sumanOpts.tail;
var removeBabel = sumanOpts.remove_babel;
var create = sumanOpts.create;
var useIstanbul = sumanOpts.use_istanbul;
var interactive = sumanOpts.interactive;
var appendMatchAny = sumanOpts.append_match_any;
var appendMatchAll = sumanOpts.append_match_all;
var appendMatchNone = sumanOpts.append_match_none;
var matchAny = sumanOpts.match_any;
var matchAll = sumanOpts.match_all;
var matchNone = sumanOpts.match_none;
var repair = sumanOpts.repair;
var uninstallBabel = sumanOpts.uninstall_babel;
var groups = sumanOpts.groups;
var useTAPOutput = sumanOpts.use_tap_output;
var useTAPJSONOutput = sumanOpts.use_tap_json_output;
var fullStackTraces = sumanOpts.full_stack_traces;
var diagnostics = sumanOpts.diagnostics;
var installGlobals = sumanOpts.install_globals;
var postinstall = sumanOpts.postinstall;
var tscMultiWatch = sumanOpts.tsc_multi_watch;
var sumanShell = sumanOpts.suman_shell;
var watchPer = sumanOpts.watch_per;
var singleProcess = sumanOpts.single_process;
var script = sumanOpts.script;
var cwdAsRoot = sumanOpts.force_cwd_to_be_project_root;
var allowOnly = sumanOpts.$allowOnly = Boolean(sumanOpts.allow_only);
var allowSkip = sumanOpts.$allowSkip = Boolean(sumanOpts.allow_skip);
var coverage = sumanOpts.$coverage = Boolean(sumanOpts.coverage);
var browser = sumanOpts.$browser = Boolean(sumanOpts.browser);
var watch = sumanOpts.$watch = Boolean(sumanOpts.watch);
if (sumanOpts.force_inherit_stdio) {
    _suman.$forceInheritStdio = true;
}
var projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = su.findProjectRoot(cwd);
if (!projectRoot) {
    if (!cwdAsRoot) {
        _suman.log.error('warning: A NPM project root could not be found given your current working directory.');
        _suman.log.error(chalk.red.bold('=> cwd:', cwd, ' '));
        _suman.log.error(chalk.red('=> Please execute the suman command from within the root of your project. '));
        _suman.log.error(chalk.red.italic('=> Suman looks for the nearest package.json file to determine the project root. '));
        _suman.log.error(chalk.red("=> Consider using the " + chalk.red.bold('"--force-cwd-to-be-project-root"') + " option."));
        _suman.log.error(chalk.red('=> Perhaps you need to run "npm init" before running "suman --init", ' +
            'which will create a package.json file for you at the root of your project.'));
        return process.exit(1);
    }
    projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = cwd;
}
if (su.vgt(7)) {
    _suman.log.info('Project root:', projectRoot);
}
if (cwd !== projectRoot) {
    if (su.vgt(1)) {
        _suman.log.info('Note that your current working directory is not equal to the project root:');
        _suman.log.info('cwd:', chalk.magenta(cwd));
        _suman.log.info('Project root:', chalk.magenta(projectRoot));
    }
}
else {
    if (su.vgt(2)) {
        if (cwd === projectRoot) {
            _suman.log.info(chalk.gray('cwd:', cwd));
        }
    }
    if (cwd !== projectRoot) {
        _suman.log.info(chalk.magenta('cwd:', cwd));
    }
}
if (singleProcess) {
    process.env.SUMAN_SINGLE_PROCESS = 'yes';
}
if (watch || watchPer) {
    if (String(process.env.SUMAN_WATCH_TEST_RUN).trim() === 'yes') {
        throw new Error('Suman watch process has launched a process which in turn will watch, this is not allowed.');
    }
}
if (sumanOpts.user_args) {
    _suman.log.info(chalk.magenta('raw user_args is'), sumanOpts.user_args);
}
var userArgs = sumanOpts.user_args = _.flatten([sumanOpts.user_args]).join(' ');
if (coverage) {
    _suman.log.info(chalk.magenta.bold('Coverage reports will be written out due to presence of --coverage flag.'));
}
var babelRegister = sumanOpts.babel_register;
var noBabelRegister = sumanOpts.no_babel_register;
var originalTranspileOption = sumanOpts.transpile = Boolean(sumanOpts.transpile);
if (sumanOpts.version) {
    console.log('\n');
    _suman.log.info('Node.js version:', nodeVersion);
    _suman.log.info('Suman version:', 'v' + sumanVersion);
    _suman.log.info('...And we\'re done here.', '\n');
    process.exit(0);
}
{
    var requireFile_1 = general.makeRequireFile(projectRoot);
    _.flattenDeep([sumanOpts.require]).filter(function (v) { return v; }).forEach(function (s) {
        String(s).split(',')
            .map(function (v) { return String(v).trim(); })
            .filter(function (v) { return v; })
            .forEach(requireFile_1);
    });
}
{
    var makeThrow = function (msg) {
        console.log('\n');
        console.error('\n');
        throw msg;
    };
    if (sumanOpts.transpile && sumanOpts.no_transpile) {
        makeThrow(' => Suman fatal problem => --transpile and --no-transpile options were both set,' +
            ' please choose one only.');
    }
    if (sumanOpts.append_match_all && sumanOpts.match_all) {
        makeThrow(' => Suman fatal problem => --match-all and --append-match-all options were both set,' +
            ' please choose one only.');
    }
    if (sumanOpts.append_match_any && sumanOpts.match_any) {
        makeThrow(' => Suman fatal problem => --match-any and --append-match-any options were both set,' +
            ' please choose one only.');
    }
    if (sumanOpts.append_match_none && sumanOpts.match_none) {
        makeThrow(' => Suman fatal problem => --match-none and --append-match-none options were both set,' +
            ' please choose one only.');
    }
    if (sumanOpts.watch && sumanOpts.stop_watching) {
        makeThrow('=> Suman fatal problem => --watch and --stop-watching options were both set, ' +
            'please choose one only.');
    }
    if (sumanOpts.babel_register && sumanOpts.no_babel_register) {
        makeThrow('=> Suman fatal problem => --babel-register and --no-babel-register command line options were both set,' +
            ' please choose one only.');
    }
}
var sumanConfig;
{
    var pth = void 0;
    try {
        pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
        sumanConfig = _suman.sumanConfig = require(pth);
    }
    catch (err) {
        _suman.log.warning(chalk.yellow(err.message));
        if (!/Cannot find module/i.test(err.stack)) {
            log.error(err.stack);
            return process.exit(1);
        }
        if (!init) {
            _suman.log.warning(chalk.yellow('Warning: Could not load your config file ' +
                'in your current working directory or given by --cfg at the command line...'));
            _suman.log.warning(chalk.yellow('...are you sure you issued the suman command in the right directory? ' +
                '...now looking for a config file at the root of your project...'));
        }
        try {
            pth = path.resolve(projectRoot + '/' + 'suman.conf.js');
            sumanConfig = _suman.sumanConfig = require(pth);
            if (sumanOpts.verbosity > 2) {
                log.info(chalk.cyan('=> Suman config used: ' + pth + '\n'));
            }
        }
        catch (err) {
            _suman.usingDefaultConfig = true;
            _suman.log.warning("Warning: suman is using a default 'suman.conf.js' file.");
            _suman.log.warning("Please create your own 'suman.conf.js' file using \"suman --init\".");
            sumanConfig = _suman.sumanConfig = require('./lib/default-conf-files/suman.default.conf.js');
        }
    }
}
if (sumanOpts.verbosity > 8) {
    _suman.log.info(' => Suman verbose message => Suman config used: ' + pth);
}
var sumanInstalledLocally = null;
var sumanInstalledAtAll = null;
var sumanServerInstalled = null;
{
    if (init) {
        log.info(chalk.magenta(' => "suman --init" is running.'));
        sumanConfig = _suman.sumanConfig = _suman.sumanConfig || {};
    }
    else {
        var vetLocalInstallations = require('./lib/cli-helpers/determine-if-suman-is-installed').vetLocalInstallations;
        var installObj = vetLocalInstallations(sumanConfig, sumanOpts, projectRoot);
        sumanInstalledAtAll = installObj.sumanInstalledAtAll;
        sumanServerInstalled = installObj.sumanServerInstalled;
        sumanInstalledLocally = installObj.sumanInstalledLocally;
    }
    var sumanPaths = general.resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
    var sumanObj = general.loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
}
if (sumanOpts.parallel && sumanOpts.series) {
    throw chalk.red('Suman usage error => "--series" and "--parallel" options were both used, ' +
        'please choose one or neither...but not both!');
}
if ('concurrency' in sumanOpts) {
    assert(Number.isInteger(sumanOpts.concurrency) && Number(sumanOpts.concurrency) > 0, chalk.red('Suman usage error => "--concurrency" option value should be an integer greater than 0.'));
}
_suman.maxProcs = sumanOpts.concurrency || sumanConfig.maxParallelProcesses || 15;
{
    sumanOpts.$useTAPOutput = _suman.useTAPOutput = sumanConfig.useTAPOutput || useTAPOutput;
    sumanOpts.$useTAPOutput && _suman.log.info('Using TAP output => ', sumanOpts.$useTAPOutput);
}
{
    sumanOpts.$useTAPJSONOutput = _suman.useTAPJSONOutput = sumanConfig.useTAPJSONOutput || useTAPJSONOutput;
    sumanOpts.$useTAPJSONOutput && _suman.log.info('Using TAP-JSON output => ', sumanOpts.$useTAPJSONOutput);
}
sumanOpts.$fullStackTraces = sumanConfig.fullStackTraces || sumanOpts.full_stack_traces;
var sumanMatchesAny = (matchAny || (sumanConfig.matchAny || []).concat(appendMatchAny || []))
    .map(function (item) { return (item instanceof RegExp) ? item : new RegExp(item); });
if (sumanMatchesAny.length < 1) {
    _suman.log.warning('No runnable file regexes available; using the default => /\.js$/');
    sumanMatchesAny.push(/\.js$/);
}
var sumanMatchesNone = (matchNone || (sumanConfig.matchNone || []).concat(appendMatchNone || []))
    .map(function (item) { return (item instanceof RegExp) ? item : new RegExp(item); });
var sumanMatchesAll = (matchAll || (sumanConfig.matchAll || []).concat(appendMatchAll || []))
    .map(function (item) { return (item instanceof RegExp) ? item : new RegExp(item); });
_suman.sumanMatchesAny = uniqBy(sumanMatchesAny, function (item) { return item; });
_suman.sumanMatchesNone = uniqBy(sumanMatchesNone, function (item) { return item; });
_suman.sumanMatchesAll = uniqBy(sumanMatchesAll, function (item) { return item; });
{
    var preOptCheck_1 = {
        tscMultiWatch: tscMultiWatch, watch: watch, watchPer: watchPer,
        create: create, useServer: useServer, useBabel: useBabel,
        useIstanbul: useIstanbul, init: init, uninstall: uninstall,
        convert: convert, groups: groups, s: s, interactive: interactive, uninstallBabel: uninstallBabel,
        diagnostics: diagnostics, installGlobals: installGlobals, postinstall: postinstall,
        repair: repair, sumanShell: sumanShell, script: script
    };
    var optCheck = Object.keys(preOptCheck_1).filter(function (key, index) {
        return preOptCheck_1[key];
    })
        .map(function (key) {
        var value = preOptCheck_1[key];
        var obj = {};
        obj[key] = value;
        return obj;
    });
    if (optCheck.length > 1) {
        console.error('\t => Too many options, pick one from:\n', util.inspect(Object.keys(preOptCheck_1)));
        console.error('\t => Current options used were:\n', util.inspect(optCheck));
        console.error('\t => Use --help for more information.\n');
        console.error('\t => Use --examples to see command line examples for using Suman in the intended manner.\n');
        process.exit(suman_constants_1.constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
    }
}
load_reporters_1.loadReporters(sumanOpts, projectRoot, sumanConfig);
rb.emit(String(events.NODE_VERSION), nodeVersion);
rb.emit(String(events.SUMAN_VERSION), sumanVersion);
var paths = _.flatten([sumanOpts._args]).slice(0);
{
    if (sumanOpts.test_paths_json) {
        var jsonPaths = JSON.parse(String(sumanOpts.test_paths_json).trim());
        jsonPaths.forEach(function (p) {
            paths.push(p);
        });
    }
    if (sumanOpts.replace_match && sumanOpts.replace_with) {
        paths = paths.map(function (p) {
            return String(p).replace(sumanOpts.replace_match, sumanOpts.replace_with);
        });
    }
    if (sumanOpts.replace_ext_with) {
        paths = paths.map(function (p) {
            return String(p).substr(0, String(p).lastIndexOf('.')) + sumanOpts.replace_ext_with;
        });
    }
    if (su.vgt(7)) {
        _suman.log.info('arguments assumed to be test file paths to be run:', paths);
    }
}
var isTTY = process.stdout.isTTY;
if (String(process.env.SUMAN_WATCH_TEST_RUN).trim() !== 'yes') {
    if (!isTTY && !useTAPOutput) {
        {
            var messages = [
                'You may need to turn on TAP output for test results to be captured in destination process.',
                'Try using the "--tap" or "--tap-json" options at the suman command line.'
            ];
            _suman.log.error(chalk.yellow.bold(messages.join('\n')));
            JSONStdio.logToStdout({ sumanMessage: true, kind: 'warning', messages: messages });
        }
    }
}
if (diagnostics) {
    require('./lib/cli-commands/run-diagnostics').run(sumanOpts);
}
else if (script) {
    require('./lib/cli-commands/run-scripts').run(sumanConfig, sumanOpts);
}
else if (tscMultiWatch) {
    require('./lib/cli-commands/run-tscmultiwatch').run(sumanOpts);
}
else if (repair) {
    require('./lib/cli-commands/run-repair').run(sumanOpts);
}
else if (postinstall) {
    require('./lib/cli-commands/postinstall').run(sumanOpts);
}
else if (installGlobals) {
    require('./lib/cli-commands/install-global-deps')(paths);
}
else if (sumanShell) {
    require('./lib/cli-commands/run-suman-shell').run(projectRoot, sumanLibRoot, sumanOpts.suman_d_opts);
}
else if (interactive) {
    require('./lib/cli-commands/run-suman-interactive').run();
}
else if (uninstallBabel) {
    require('./lib/use-babel/uninstall-babel')(null);
}
else if (useIstanbul) {
    require('./lib/use-istanbul/use-istanbul')();
}
else if (create) {
    require('./lib/cli-commands/create-opt').run(create);
}
else if (useServer) {
    require('./lib/use-server/use-server')(null);
}
else if (useBabel) {
    require('./lib/use-babel/use-babel')(null);
}
else if (init) {
    require('./lib/cli-commands/init-opt').run(sumanOpts, projectRoot, cwd);
}
else if (uninstall) {
    require('./lib/uninstall/uninstall-suman')({
        force: force,
        fforce: fforce,
        removeBabel: removeBabel,
    });
}
else if (convert) {
    require('./lib/cli-commands/convert-mocha').run(projectRoot, src, dest, force);
}
else if (s) {
    require('./lib/cli-commands/start-suman-server')(sumanServerInstalled, sumanConfig, serverName);
}
else if (!browser && (watch || watchPer)) {
    require('./lib/cli-commands/watching').run(projectRoot, paths, sumanOpts, sumanConfig);
}
else if (groups) {
    require('./lib/cli-commands/groups').run(paths);
}
else {
    if (userArgs.length > 0 && sumanOpts.verbosity > 4) {
        _suman.log.info('The following "--user-args" will be passed to child processes as process.argv:');
        _suman.log.info(userArgs);
    }
    require('./lib/run').run(sumanOpts, sumanConfig, paths, sumanServerInstalled, sumanVersion);
}
