'use strict';
// important note: "use strict" so errors get thrown if properties are modified after the fact


//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

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
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const sumanUtils = require('suman-utils');
const originalAcquireDeps = require('../acquire-deps-original');
const handleSetupComplete = require('../handle-setup-complete');
const makeAcquireDepsFillIn = require('../acquire-deps-fill-in');
const handleInjections = require('../handle-injections');

///////////////////////////////////////////////////////////////////////


function handleBadOptions(opts: IDescribeOpts) {
  // TODO
  return;
}

// notifyParentThatChildIsComplete(self.parent.testId, self.testId


///////////////////////////////////////////////////////////////////////

export = function (suman: ISuman, gracefulExit: Function, TestSuiteMaker: TTestSuiteMaker,
                   zuite: ITestSuite, notifyParentThatChildIsComplete: Function): Function {

  const acquireDepsFillIn = makeAcquireDepsFillIn(suman);
  const allDescribeBlocks = suman.allDescribeBlocks;

  return function ($desc: string, $opts: IDescribeOpts, $arr?: Array<
                     string
                     | TDescribeHook>, $cb?: TDescribeHook): void {

    handleSetupComplete(zuite);

    const args = pragmatik.parse(arguments, rules.blockSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    let [desc, opts, arr, cb] = args;
    handleBadOptions(opts);

    if (arr && cb) {
      throw new Error(' => Please define either an array or callback, but not both.');
    }

    let arrayDeps: Array<string>;

    if (arr) {
      //note: you can't stub a test block!
      cb = arr[arr.length - 1];
      assert.equal(typeof cb, 'function', ' => Suman usage error => ' +
        'You need to pass a function as the last argument to the array.');
      // remove last element
      arr.splice(-1, 1);
      arrayDeps = arr.map(function (item: any) {
        return String(item);
      });
    }

    //avoid unncessary pre-assignment
    arrayDeps = arrayDeps || [];

    if (arrayDeps.length > 0) {
      const preVal: Array<string> = [];

      arrayDeps.forEach(function (a) {
        if (/:/.test(a)) {
          preVal.push(a);
        }
      });

      const toEval = ['(function(){return {', preVal.join(','), '}}()'];
      const obj = eval(toEval.join(''));
      //overwrite opts with values from array
      Object.assign(opts, obj);
    }

    //////////

    const allowArrowFn = _suman.sumanConfig.allowArrowFunctionsForTestBlocks;
    const isArrow = sumanUtils.isArrowFunction(cb);
    const isGenerator = sumanUtils.isGeneratorFn(cb);
    const isAsync = sumanUtils.isAsyncFn(cb);

    if ((isArrow && !allowArrowFn) || isGenerator || isAsync) { //TODO: need to check for generators or async/await as well
      const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
      console.log('\n\n' + msg + '\n\n');
      console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
      process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
      return;
    }

    if (zuite.parallel && opts.parallel === false) {
      console.log('\n => Suman warning => parent block ("' + zuite.desc + '") is parallel, ' +
        'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
      console.log('\n => Suman warning => To see more info on this, visit: sumanjs.github.io\n\n');
    }

    if (zuite.skipped) {
      let msg = ' => Suman implementation warning => Child suite entered when parent was skipped.';
      console.error(msg);
      console.error(' => Please open an issue with the following stacktrace:', '\n');
      console.error(new Error(msg).stack);
    }

    if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
      suman.numBlocksSkipped++;
      return;
    }

    // note: zuite is the parent of suite
    // aka, suite is the child of zuite
    const suite = TestSuiteMaker({
      desc: desc,
      title: desc,
      opts: opts
    });

    // if parent is skipped, child is skipped,
    suite.skipped = opts.skip || zuite.skipped;

    if (!suite.only && suman.describeOnlyIsTriggered) {
      suite.skipped = suite.skippedDueToDescribeOnly = true;
    }

    suite.parent = _.pick(zuite, 'testId', 'desc', 'title', 'parallel');
    zuite.getChildren().push({testId: suite.testId});
    allDescribeBlocks.push(suite);

    const deps = fnArgs(cb);
    const suiteProto: Object = Object.getPrototypeOf(suite);

    suiteProto._run = function run(val: any, callback: Function) {

      if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
        //TODO: have to notify parent that child is done?
        // if(zuite.parent){
        //notifyParentThatChildIsComplete(self.parent.testId, self.testId, callback);
        // }
        throw new Error(' => Suman implementation error, this code should not be reached.');
        return process.nextTick(callback);
      }

      const d = domain.create();

      d.once('error', function (err: Error) {
        if (_suman.weAreDebugging) {
          console.error(err.stack || err);
        }
        console.log(' => Error executing test block => ', err.stack);
        err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
        gracefulExit(err);
      });

      d.run(function () {

        // note: *very important* => each describe block needs to be invoked in series, one by one,
        // so that we bind skip and only to the right suite

        suite.getResumeValue = function (): any {
          return val;
        };

        suite.__bindExtras();

        originalAcquireDeps(deps, function (err: Error, deps: Array<any>) {

          if (err) {
            console.log(err.stack || err);
            process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
          }
          else {

            process.nextTick(function () {

              let $deps;

              try {
                $deps = acquireDepsFillIn(suite, zuite, deps);
              }
              catch (err) {
                console.error(err.stack || err);
                return gracefulExit(err);
              }

              suite.fatal = function (err: Error) {
                err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                console.log(err.stack || err);
                err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                gracefulExit(err);
              };

              const delayOptionElected = !!opts.delay;

              if (!delayOptionElected) {

                suiteProto.__resume = function () {
                  console.error('\n', ' => Suman usage warning => suite.resume() has become a noop since delay option is falsy.');
                };

                cb.apply(suite, $deps);

                handleInjections(suite, function (err: Error) {

                  if (err) {
                    console.error(err.stack || err);
                    gracefulExit(err);
                  }
                  else {
                    d.exit();
                    suiteProto.isSetupComplete = true;
                    process.nextTick(function () {
                      zuite.__bindExtras();  //bind extras back to parent test
                      suite.__invokeChildren(null, callback);
                    });
                  }
                });

              }

              else {
                suiteProto.isDelayed = true;

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

                  return; //hard, ugly and visible
                }

                const to = setTimeout(function () {
                  console.error('\n\n => Suman fatal error => delay function was not called within alloted time.');
                  process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                }, 11000);

                let callable = true;

                suiteProto.__resume = function (val: any) {
                  if (callable) {
                    callable = false;
                    clearTimeout(to);
                    d.exit();
                    //need to make sure delay is called asynchronously, but this should take care of it
                    process.nextTick(function () {
                      suiteProto.isSetupComplete = true; // keep this, needs to be called asynchronously
                      zuite.__bindExtras();  //bind extras back to parent test
                      suite.__invokeChildren(val, callback); // pass callback
                    });
                  }
                  else {
                    let w = ' => Suman usage warning => suite.resume() was called more than once.';
                    console.error(w);
                    _suman._writeTestError(w)
                  }

                };

                cb.apply(suite, $deps);
              }

            });
          }
        });

      });
    };
  };

};
