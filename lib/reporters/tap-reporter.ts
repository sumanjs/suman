'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
import {events} from 'suman-events';
import EventEmitter = NodeJS.EventEmitter;
import {ISumanChildProcess} from "../../dts/runner";
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});

function title(test) {
  return String(test.title || test.desc || test.description || test.name).replace(/#/g, '');
}

//////////////////////////////////////////////////////////

function logDebug() {
  let debug;
  if (debug = process.env.SUMAN_DEBUG) {
    const args = Array.from(arguments).filter(i => i);
    args.forEach(function (a) {
      process.stderr.write('\n' + (typeof a === 'string' ? a : util.inspect(a)) + '\n');
    });
  }
  return debug;
}

interface IStringVarargs {
  (...args: string[]): void;
}

let onAnyEvent : IStringVarargs = function () {
  if (!logDebug.apply(null, arguments)) {
    const args = Array.from(arguments).map(function (data) {
      return typeof data === 'string' ? data : util.inspect(data);
    });
    return console.log.apply(console, args);
  }
};

let count = 0;

//////////////////////////////////////////////////////////

export = (s: EventEmitter) => {

  count++;
  if (count > 1) {
    _suman.logError('Implementation error => Tap reporter loaded more than once.');
    return;
  }

  let sumanOpts = _suman.sumanOpts;
  let level = _suman.inceptionLevel;

  let isColorable = function (): boolean {
    return level < 1 && !sumanOpts.no_color;
  };

  let n = 0;
  let passes = 0;
  let failures = 0;
  let skipped = 0;
  let stubbed = 0;

  s.on(String(events.RUNNER_INITIAL_SET),
    function (forkedCPs: Array<ISumanChildProcess>, processes: string, suites: string) {
      onAnyEvent('\n\n\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  initial set => ' +
          forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' ') + '\n');
    });

  s.on(String(events.RUNNER_OVERALL_SET),
    function (totalCount: number, processes: string, suites: string, addendum: string) {
      onAnyEvent('\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  overall set => '
          + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + (suites + addendum) + ' ') + '\n\n\n');
    });

  s.on(String(events.RUNNER_ASCII_LOGO), function (logo: string) {
    onAnyEvent('\n\n' + logo + '\n\n')
  });

  s.on(String(events.RUNNER_STARTED), function () {
    _suman.log('Suman runner has started.\n');
  });

  s.on(String(events.RUNNER_ENDED), function () {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
    console.log('# stubbed ' + failures);
    console.log('# skipped ' + failures);
  });

  s.on(String(events.TAP_COMPLETE), function (data) {
    console.log('all TAP input received.');
  });

  s.on(String(events.TEST_CASE_END), function (test) {
    ++n;
  });

  s.on(String(events.TEST_CASE_FAIL), function (test) {
    failures++;
    if (isColorable()) {
      console.log(colors.red(`not ok ${n} ${title(test)}`));
    }
    else {
      console.log('not ok %d %s', n, title(test));
    }

  });

  s.on(String(events.TEST_CASE_PASS), function (test) {
    passes++;
    if (isColorable()) {
      console.log(colors.green(`ok ${n} ${title(test)}`));
    }
    else {
      console.log('ok %d %s', n, title(test));
    }

  });

  s.on(String(events.TEST_CASE_SKIPPED), function (test) {
    skipped++;
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  s.on(String(events.TEST_CASE_STUBBED), function (test) {
    stubbed++;
    console.log('ok %d %s # STUBBED -', n, title(test));
  });

  s.on(String(events.STANDARD_TABLE), function (table: Object) {
    if (!sumanOpts.no_tables) {
      console.log('\n\n');
      let str = table.toString();
      str = '\t' + str;
      console.log(str.replace(/\n/g, '\n\t'));
      console.log('\n');
    }
  });

  s.on(String(events.RUNNER_EXIT_CODE), function (code: number) {
    onAnyEvent(['\n  ',
      ' <::::::::::::::::::::::::::::::::: Suman runner exiting with exit code: ' + code +
      ' :::::::::::::::::::::::::::::::::>', '\n'].join('\n'));
  });

  s.on(String(events.RUNNER_RESULTS_TABLE), function (allResultsTableString: string) {
    if (!sumanOpts.no_tables) {
      onAnyEvent('\n\n' + allResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(String(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS), function (strSorted: string) {
    if (!sumanOpts.no_tables) {
      onAnyEvent('\n\n' + strSorted.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(String(events.RUNNER_OVERALL_RESULTS_TABLE), function (overallResultsTableString: string) {
    if (!sumanOpts.no_tables) {
      onAnyEvent(overallResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  _suman.log('TAP reporter loaded.');

};
