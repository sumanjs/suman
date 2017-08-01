'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var util = require("util");
var async = require("async");
var rimraf = require('rimraf');
var chalk = require("chalk");
var flattenDeep = require('lodash.flattendeep');
var _suman = global.__suman = (global.__suman || {});
var use_container_1 = require("./use-container");
var use_sh_1 = require("./use-sh");
var suman_constants_1 = require("../../../config/suman-constants");
exports.run = function (paths) {
    var projectRoot = _suman.projectRoot, sumanOpts = _suman.sumanOpts;
    var groupLogs = path.resolve(_suman.sumanHelperDirRoot + '/logs/groups');
    var p = path.resolve(_suman.sumanHelperDirRoot + '/suman.groups.js');
    var isUseContainer = sumanOpts.use_container === true ? true : undefined;
    if (sumanOpts.no_use_container === true) {
        isUseContainer = false;
    }
    var isAllowReuseImage = sumanOpts.allow_reuse_image === true ? true : undefined;
    if (sumanOpts.no_allow_reuse_image === true) {
        isAllowReuseImage = false;
    }
    var groupsFn = require(p);
    var originalGroups;
    var _data = {};
    if (isUseContainer !== undefined) {
        _data.useContainer = isUseContainer;
    }
    if (isAllowReuseImage !== undefined) {
        _data.allowReuseImage = isAllowReuseImage;
    }
    var groups = originalGroups = groupsFn(_data).groups;
    if (paths && paths.length > 0) {
        console.log('\n', chalk.cyan(' => Suman message => Only the following groups will be run => ' +
            paths.map(function (p) { return '\n => "' + p + '"'; })), '\n');
        groups = groups.filter(function (g) {
            return paths.indexOf(g.name) > -1;
        });
        groups.forEach(function (g) {
            console.log(' => Suman cli will execute group with name => "' + g.name + '"');
        });
    }
    if (groups.length < 1) {
        console.error('\n\n', chalk.red.bold(' => Suman usage error => No suman group matched a name passed at the command line.'));
        console.error('\n\n', chalk.green.bold(' => Suman message => Available suman group names are =>  \n'
            + originalGroups.map(function (g) { return '\n => "' + g.name + '"'; })), '\n');
        return process.exit(suman_constants_1.constants.CLI_EXIT_CODES.NO_GROUP_NAME_MATCHED_COMMAND_LINE_INPUT);
    }
    async.series({
        rimraf: function (cb) {
            rimraf(groupLogs, cb);
        },
        mkdir: function (cb) {
            fs.mkdir(groupLogs, cb);
        }
    }, function (err) {
        if (err) {
            throw err;
        }
        var concurrency = sumanOpts.concurrency || 1;
        console.log('\n', chalk.cyan(' => Suman message => Running suman groups with a --concurrency of => '
            + concurrency + ' '), '\n');
        if (!sumanOpts.concurrency) {
            console.log(chalk.yellow(' => You must explicitly set concurrency, using the suman groups feature, ' +
                'otherwise it defaults to 1.'));
        }
        var totalCount = groups.length;
        console.log(' => ', totalCount, ' Suman groups will be run.');
        var finishedCount = 0;
        async.mapLimit(groups, concurrency, function (item, cb) {
            var logfile = path.resolve(groupLogs + '/' + item.name + '.log');
            var strm = fs.createWriteStream(logfile, { end: false });
            strm.on('error', function (err) {
                console.log(' => User test script error, for item => ', util.inspect(item), '\n', chalk.cyan(' Try running the script directly, if the error is not obvious.'), '\n', ' => Check the logs at <suman-helpers-dir>/logs/groups', '\n', chalk.magenta(err.stack || err));
            });
            strm.write(' => Beginning of run.\n');
            console.log(chalk.bgGreen.black.bold(' => Suman message => Group name => ', item.name));
            if (item.useContainer) {
                console.log('\n', chalk.cyan(' => Suman => using container for item => ') +
                    '\n' + chalk.blue(util.inspect(item)), '\n');
                use_container_1.runUseContainer(strm, item, function () {
                    finishedCount++;
                    console.log(' => Suman groups finished count => ', finishedCount, '/', totalCount);
                    cb.apply(null, arguments);
                });
            }
            else {
                console.log('\n', chalk.cyan(' => Suman => running item directly => ') +
                    '\n' + chalk.blue(util.inspect(item)), '\n');
                use_sh_1.runUseSh(strm, item, function () {
                    finishedCount++;
                    console.log(' => Suman groups finished count => ', finishedCount, '/', totalCount);
                    cb.apply(null, arguments);
                });
            }
        }, function (err, results) {
            if (err) {
                console.log(' => Suman groups has errored-out => ', (err.stack || err));
                console.log(' => Suman groups is exiting with code 1');
                process.exit(1);
            }
            else {
                results = flattenDeep([results]);
                console.log('\n', chalk.cyan(' => Suman groups results => \n' +
                    results.map(function (r) {
                        return '\n' + util.inspect(r);
                    })), '\n');
                var exitCode_1 = 0;
                results.forEach(function (data) {
                    exitCode_1 = Math.max(exitCode_1, data.code);
                });
                process.exit(exitCode_1);
            }
        });
    });
};
