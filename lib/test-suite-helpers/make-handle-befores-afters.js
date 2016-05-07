/**
 * Created by denman on 3/14/2016.
 */


//#core
const domain = require('domain');

//#npm
const _ = require('lodash');

//#project
const sumanUtils = require('../utils');
const fnArgs = require('function-arguments');
const debug_core = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');
const helpers = require('./handle-callback-helpers');
const constants = require('../../config/suman-constants');

module.exports = function (suman, gracefulExit) {

    return function (self) {

        return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

            const timeout = global.weAreDebugging ? 500000 : 5000;
            const timer = setTimeout(function () {
                fini(aBeforeOrAfter.timeOutError);
            }, timeout);

            const d = domain.create();
            d._sumanBeforeAfter = true;

            const fini = helpers.makeCallback(d, null, null, aBeforeOrAfter, timer, 'before/after', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);

            var dError = false;

            //TODO: need to add more info to logging statement below and also handle if fatal:false
            d.on('error', function (err) {

                const stk = err.stack || err;

                if (!dError) {
                    dError = true;
                    if(aBeforeOrAfter.fatal === false){
                        console.error(' => Suman non-fatal error => Error in hook and "fatal" option for the hook is set to false => \n' + stk);
                    }
                    else{
                        err = new Error(' => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) => ' + '\n' + stk);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                        gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                    }
                }
                else {
                    console.error(' => Suman error => Error in hook => \n' + stk);
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

                    var indexDone, indexCtn, indexFatal;

                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfter.fn);
                    const hasDoneParam = (indexDone = args.indexOf('done')) > -1;
                    const hasCtnParam = (indexCtn = args.indexOf('ctn')) > -1;
                    const hasFatalParam = (indexFatal = args.indexOf('fatal')) > -1;
                    const has_xParam = (index_x = args.indexOf('_x')) > -1;


                    if (isGeneratorFn) {

                        if (hasDoneParam || hasCtnParam) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfter.fn, args, aBeforeOrAfter.ctx);
                    }

                    else if (hasDoneParam || hasCtnParam) {

                        //TODO: if function is passed only fatal function then what?
                        // will probably need to throw an error here

                        if (hasDoneParam) {
                            args.splice(indexDone, 1, function done(err) {
                                fini(err);
                            });
                        }

                        if (hasCtnParam) {
                            args.splice(indexCtn, 1, function ctn() {
                                fini(null);
                            });
                        }

                        if (hasFatalParam) {
                            args.splice(indexFatal, 1, function fatal(err) {
                                fini(err || new Error('No error passed by user to fatal fn, but this is fatal now.'));
                            });
                        }


                        //if (!sumanUtils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                        //    throw aBeforeOrAfter.NO_DONE;
                        //}

                        aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args);

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfter.fn.apply(aBeforeOrAfter.ctx, args), warn);

                    }

                });

            });
        }
    }
};