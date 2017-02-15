'use strict';  // important note: so errors get thrown if properties are modified after the fact

//TODO: create immutable props - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

//core
const domain = require('domain');
const util = require('util');
const assert = require('assert');

//npm
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');

//project
const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const sumanUtils = require('suman-utils/utils');
const originalAcquireDeps = require('../acquire-deps-original');
const handleSetupComplete = require('../handle-setup-complete');
const makeAcquireDepsFillIn = require('../acquire-deps-fill-in');
const handleInjections = require('../handle-injections');

///////////////////////////////////////////////////////////////////////

module.exports = function (suman, gracefulExit, TestSuiteMaker, zuite) {

  const acquireDepsFillIn = makeAcquireDepsFillIn(suman);
  const allDescribeBlocks = suman.allDescribeBlocks;

  return function (desc, opts, cb) {

    handleSetupComplete(zuite);
    const _args = pragmatik.parse(arguments, rules.blockSignature, {
      preParsed: typeof opts === 'object' ? opts.__preParsed : null
    });

    desc = _args[0];
    opts = _args[1];
    cb = _args[2];

    const allowArrowFn = global.sumanConfig.allowArrowFunctionsForTestBlocks;
    const isArrow = sumanUtils.isArrowFunction(cb);
    const isGenerator = sumanUtils.isGeneratorFn(cb);
    const isAsync = sumanUtils.isAsyncFn(cb);

    if ((isArrow && !allowArrowFn) || isGenerator || isAsync) { //TODO: need to check for generators or async/await as well
      const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
      console.log('\n\n' + msg + '\n\n');
      console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
      return process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
    }

    if (zuite.parallel && opts.parallel === false) {
      process.stdout.write('\n => Suman warning => parent block ("' + zuite.desc + '") is parallel, ' +
        'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
      process.stdout.write('\n => Suman warning => To see more info on this, visit: sumanjs.github.io\n\n');
    }

    if (zuite.skipped) {
      console.error(' => Implementation warning => Child suite entered when parent was skipped.');
    }

    if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
      suman.numBlocksSkipped++;
      return;
    }

    const parent = zuite;
    const suite = TestSuiteMaker({
      desc: desc,
      title: desc,
      opts: opts
    });

    suite.skipped = opts.skip || zuite.skipped;

    if (!suite.only && suman.describeOnlyIsTriggered) {
      suite.skipped = suite.skippedDueToDescribeOnly = true;
    }

    suite.parent = _.pick(zuite, 'testId', 'desc', 'title', 'parallel');

    zuite.getChildren().push({testId: suite.testId});
    allDescribeBlocks.push(suite);

    const deps = fnArgs(cb);

    suite.__proto__._run = function run(val, callback) {

      if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
        //TODO: have to notify parent that child is done?
        return process.nextTick(callback);
      }

      const d = domain.create();

      d.once('error', function (err) {
        if (global.weAreDebugging) {
          console.error(err.stack || err);
        }
        console.log(' => Error executing test block => ', err.stack);
        err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
        gracefulExit(err);
      });

      d.run(function () {

        // note: *very important* => each describe block needs to be invoked in series, one by one,
        // so that we bind skip and only to the right suite

        suite.getResumeValue = function () {
          return val;
        };

        suite.__bindExtras();

        originalAcquireDeps(deps, function (err, deps) {

          if (err) {
            console.log(err.stack || err);
            process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
          }
          else {

            process.nextTick(function () {

              acquireDepsFillIn(suite, parent, deps, function (err, $deps) {

                if (err) {
                  console.error(err.stack || err);
                  return gracefulExit(err);
                }

                suite.fatal = function (err) {
                  err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                  console.log(err.stack || err);
                  err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                  gracefulExit(err);
                };

                const delayOptionElected = !!opts.delay;

                if (!delayOptionElected) {

                  suite.__proto__.__resume = function () {
                    console.error('\n', ' => Suman usage warning => suite.resume() has become a noop since delay option is falsy.');
                  };

                  cb.apply(suite, $deps);

                  handleInjections(suite, function (err) {

                    if (err) {
                      console.error(err.stack || err);
                      gracefulExit(err);
                    }
                    else {
                      d.exit();
                      suite.__proto__.isSetupComplete = true;
                      process.nextTick(function () {
                        parent.__bindExtras();  //bind extras back to parent test
                        suite.__invokeChildren(null, callback);
                      });
                    }
                  });

                }

                else {
                  suite.__proto__.isDelayed = true;

                  const str = cb.toString();
                  //TODO this will not work when delay is simply commented out

                  if (!sumanUtils.checkForValInStr(str, /resume/g, 0)) {
                    process.nextTick(function () {
                      console.error(new Error(' => Suman usage error => delay option was elected, so suite.resume() ' +
                        'method needs to be called to continue,' +
                        ' but the resume method was never referenced in the needed location, so your test cases would ' +
                        'never be invoked before timing out => \n\n' + str).stack);
                      process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                    });

                    return; //hard ugly and visible
                  }

                  const to = setTimeout(function () {
                    console.error('\n\n => Suman fatal error => delay function was not called within alloted time.');
                    process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                  }, 11000);

                  var callable = true;

                  suite.__proto__.__resume = function (val) {
                    if (callable) {
                      callable = false;
                      clearTimeout(to);
                      d.exit();
                      //need to make sure delay is called asynchronously, but this should take care of it
                      process.nextTick(function () {
                        suite.__proto__.isSetupComplete = true; // keep this, needs to be called asynchronously
                        parent.__bindExtras();  //bind extras back to parent test
                        suite.__invokeChildren(val, callback); // pass callback
                      });
                    }
                    else {
                      console.error(' => Suman usage warning => suite.resume() was called more than once.');
                    }

                  };

                  cb.apply(suite, $deps);

                }

              });

            });
          }
        });

      });
    };
  };

};
