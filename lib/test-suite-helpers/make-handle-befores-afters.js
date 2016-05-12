/**
 * Created by denman on 3/14/2016.
 */


//#core
const domain = require('domain');
const assert = require('assert');

//#npm
const _ = require('lodash');

//#project
const sumanUtils = require('../utils');
const fnArgs = require('function-arguments');
const debug_core = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');
const helpers = require('./handle-callback-helpers');
const constants = require('../../config/suman-constants');
const cloneError = require('../clone-error');
const HookObj = require('../t-proto-hook');

module.exports = function (suman, gracefulExit) {

    return function (self) {

        return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

            const timerObj = {
                timer: setTimeout(onTimeout, global.weAreDebugging ? 5000000 : 5000)
            };

            const d = domain.create();
            d._sumanBeforeAfter = true;

            const fini = helpers.makeCallback(d, null, null, aBeforeOrAfter, timerObj, 'before/after', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);

            function onTimeout() {
                fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
            }

            var dError = false;

            //TODO: need to add more info to logging statement below and also handle if fatal:false
            d.on('error', function (err) {

                const stk = err.stack || err;

                if (!dError) {
                    dError = true;
                    if (aBeforeOrAfter.fatal === false) {
                        console.error(' => Suman non-fatal error => Error in hook and "fatal" option for the hook is set to false => \n' + stk);
                    }
                    else {
                        err = new Error(' => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) => ' + '\n' + stk);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                        gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                    }
                }
                else {
                    global._writeTestError(' => Suman error => Error in hook => \n' + stk);
                }

            });

            d.run(function () {

                process.nextTick(function () {

                    var warn = false;
                    const str = aBeforeOrAfter.fn.toString();

                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                        warn = true;
                    }

                    const args = fnArgs(aBeforeOrAfter.fn);
                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfter.fn);


                    function timeout(val) {
                        timerObj.timer = setTimeout(onTimeout, global.weAreDebugging ? 500000 : val);
                    }


                    const t = new HookObj(fini);
                    t.timeout = timeout;


                    args.splice(0, 1, t);

                    if (isGeneratorFn) {

                        if (aBeforeOrAfter.cb) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfter.fn, args, aBeforeOrAfter.ctx);
                    }
                    else if (aBeforeOrAfter.cb) {

                        t.callbackMode = true;
                        
                        //TODO: if function is passed only fatal function then what?
                        // will probably need to throw an error here

                        //if (!sumanUtils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                        //    throw aBeforeOrAfter.NO_DONE;
                        //}

                        if (aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args)) {
                            console.error(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                        }

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args), warn);

                    }

                });

            });
        }
    }
};