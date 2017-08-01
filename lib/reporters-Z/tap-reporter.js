'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var suman_events_1 = require("suman-events");
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
function title(test) {
    return String(test.title || test.desc || test.description || test.name).replace(/#/g, '');
}
function logDebug() {
    var debug;
    if (debug = process.env.SUMAN_DEBUG) {
        var args = Array.from(arguments).filter(function (i) { return i; });
        args.forEach(function (a) {
            process.stderr.write('\n' + (typeof a === 'string' ? a : util.inspect(a)) + '\n');
        });
    }
    return debug;
}
var onAnyEvent = function () {
    if (!logDebug.apply(null, arguments)) {
        var args = Array.from(arguments).map(function (data) {
            return typeof data === 'string' ? data : util.inspect(data);
        });
        return console.log.apply(console, args);
    }
};
var count = 0;
module.exports = function (s, opts) {
    if (global.__suman.inceptionLevel < 1) {
        console.log('suman inception is 0, we do not load tap reporter.');
        return;
    }
    console.log('tap reporter loaded XXX');
    count++;
    if (count > 1) {
        _suman.logError('Implementation error => Tap reporter loaded more than once.');
        return;
    }
    var sumanOpts = _suman.sumanOpts;
    var level = _suman.inceptionLevel;
    var isColorable = function () {
        return level < 1 && !sumanOpts.no_color;
    };
    var n = 0;
    var passes = 0;
    var failures = 0;
    var skipped = 0;
    var stubbed = 0;
    s.on(String(suman_events_1.events.RUNNER_INITIAL_SET), function (forkedCPs, processes, suites) {
        onAnyEvent('\n\n\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  initial set => ' +
            forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' ') + '\n');
    });
    s.on(String(suman_events_1.events.RUNNER_OVERALL_SET), function (totalCount, processes, suites, addendum) {
        onAnyEvent('\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  overall set => '
            + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + (suites + addendum) + ' ') + '\n\n\n');
    });
    s.on(String(suman_events_1.events.RUNNER_ASCII_LOGO), function (logo) {
        onAnyEvent('\n\n' + logo + '\n\n');
    });
    s.on(String(suman_events_1.events.RUNNER_STARTED), function () {
        _suman.log('Suman runner has started.\n');
    });
    s.on(String(suman_events_1.events.RUNNER_ENDED), function () {
        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
        console.log('# stubbed ' + failures);
        console.log('# skipped ' + failures);
    });
    s.on(String(suman_events_1.events.TAP_COMPLETE), function (data) {
        console.log('all TAP input received.');
    });
    s.on(String(suman_events_1.events.TEST_CASE_END), function (test) {
        ++n;
    });
    s.on(String(suman_events_1.events.TEST_CASE_FAIL), function (test) {
        failures++;
        if (isColorable()) {
            console.log(colors.red("not ok " + n + " " + title(test)));
        }
        else {
            console.log('not ok %d %s', n, title(test));
        }
    });
    s.on(String(suman_events_1.events.TEST_CASE_PASS), function (test) {
        passes++;
        if (isColorable()) {
            console.log(colors.green("ok " + n + " " + title(test)));
        }
        else {
            console.log('ok %d %s', n, title(test));
        }
    });
    s.on(String(suman_events_1.events.TEST_CASE_SKIPPED), function (test) {
        skipped++;
        console.log('ok %d %s # SKIP -', n, title(test));
    });
    s.on(String(suman_events_1.events.TEST_CASE_STUBBED), function (test) {
        stubbed++;
        console.log('ok %d %s # STUBBED -', n, title(test));
    });
    s.on(String(suman_events_1.events.STANDARD_TABLE), function (table) {
        if (!sumanOpts.no_tables) {
            console.log('\n\n');
            var str = table.toString();
            str = '\t' + str;
            console.log(str.replace(/\n/g, '\n\t'));
            console.log('\n');
        }
    });
    s.on(String(suman_events_1.events.RUNNER_EXIT_CODE), function (code) {
        onAnyEvent(['\n  ',
            ' <::::::::::::::::::::::::::::::::: Suman runner exiting with exit code: ' + code +
                ' :::::::::::::::::::::::::::::::::>', '\n'].join('\n'));
    });
    s.on(String(suman_events_1.events.RUNNER_RESULTS_TABLE), function (allResultsTableString) {
        if (!sumanOpts.no_tables) {
            onAnyEvent('\n\n' + allResultsTableString.replace(/\n/g, '\n\t') + '\n\n');
        }
    });
    s.on(String(suman_events_1.events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS), function (strSorted) {
        if (!sumanOpts.no_tables) {
            onAnyEvent('\n\n' + strSorted.replace(/\n/g, '\n\t') + '\n\n');
        }
    });
    s.on(String(suman_events_1.events.RUNNER_OVERALL_RESULTS_TABLE), function (overallResultsTableString) {
        if (!sumanOpts.no_tables) {
            onAnyEvent(overallResultsTableString.replace(/\n/g, '\n\t') + '\n\n');
        }
    });
    _suman.log('TAP reporter loaded ZZZZZ.');
};
