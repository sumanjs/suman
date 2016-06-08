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
const freezeExistingProps = require('../freeze-existing');

module.exports = function (suman, gracefulExit) {

    return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

        const timerObj = {
            timer: setTimeout(onTimeout, global.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
        };

        const d = domain.create();
        d._sumanBeforeAfter = true;
        d._sumanBeforeAfterDesc = aBeforeOrAfter.desc || '(unknown)';

        const fini = helpers.makeCallback(d, null, null, aBeforeOrAfter, timerObj, 'before/after', cb);


        const fnStr = aBeforeOrAfter.fn.toString();
        const handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
        const handleGenerator = helpers.makeHandleGenerator(fini);

        function onTimeout() {
            fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
        }

        //TODO: need to add more info to logging statement below and also handle if fatal:false
        var dError = false;

        function handleError(err) {

            const stk = err.stack || err;
            const formatedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');

            if (!dError) {
                dError = true;
                if (aBeforeOrAfter.fatal === false) {

                    const msg = '\t => Suman non-fatal error => Error in hook and "fatal" option for the hook is set to false => \n' + formatedStk;
                    console.log('\n\n\t', msg, '\n\n');
                    global._writeTestError(msg);
                    fini(null);
                }
                else {
                    err = new Error('\t => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) => ' + '\n' + formatedStk);
                    err.sumanFatal = true;
                    err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                    gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                }
            }
            else {
                global._writeTestError(' => Suman error => Error in hook => \n' + stk);
            }

        }

        d.on('error', handleError);

        d.run(function () {

            process.nextTick(function () {

                var warn = false;

                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }

                const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfter.fn);

                function timeout(val) {
                    timerObj.timer = setTimeout(onTimeout, global.weAreDebugging ? 500000 : val);
                }

                const t = new HookObj(handleError);
                t.timeout = timeout;

                const d = function done(err) {
                    fini(err);
                };

                t.done = function done(err) {
                    fini(err);
                };

                t.ctn = t.pass = function ctn() {
                    fini(null);   //TODO: use spread operator here?
                };

                t.fatal = t.fail = function fatal(err) {
                    err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
                    fini(err);
                };

                const args = [_.merge(d, freezeExistingProps(t))];

                if (isGeneratorFn) {

                    if (aBeforeOrAfter.cb) {
                        throw new Error('Generator function callback also asking for done param => inconsistent.');
                    }

                    handleGenerator(aBeforeOrAfter.fn, args, aBeforeOrAfter.ctx);
                }
                else if (aBeforeOrAfter.cb) {

                    t.callbackMode = true;

                    //if (!sumanUtils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                    //    throw aBeforeOrAfter.NO_DONE;
                    //}

                    if (aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args)) {  //check to see if we have a defined return value
                        global._writeTestError(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }

                }
                else {

                    handlePotentialPromise(aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args), warn);

                }

            });

        });
    }
};