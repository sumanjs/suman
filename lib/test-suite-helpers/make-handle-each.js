/**
 * Created by denman on 3/13/2016.
 */

//#core
const domain = require('domain');

//#npm
const _ = require('lodash');
const fnArgs = require('function-arguments');
const helpers = require('./handle-callback-helpers');

//#project
const sumanUtils = require('../utils');
const constants = require('../../config/suman-constants');

module.exports = function (suman, gracefulExit) {

    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {

        if (test.skipped || test.stubbed) {
            process.nextTick(function () {
                cb(null);
            })
        }
        else {
            const timeout = suman.weAreDebugging ? 500000 : 5000;

            const timer = setTimeout(function () {
                fini(aBeforeOrAfterEach.timeOutError);
            }, timeout);

            const d = domain.create();
            d._suman = true;

            const fini = helpers.makeCallback(d, null, timer, true, cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);

            var dError = false;
            d.on('error', function (err) {
                if (!dError) {
                    dError = true;

                    this.exit();
                    process.nextTick(function () {
                        err = new Error(' => fatal error in hook => (to ignore an error in hook use option {fatal:false}) =>' + '\n' + err.stack);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                        gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                    });
                }
                else {
                    console.error(err.stack || err);
                }
            });

            d.run(function () {

                process.nextTick(function () {


                    var warn, isAsyncAwait = false;

                    var str = aBeforeOrAfterEach.toString(); //TODO: need to check if it's a promise instead of a function if we go that route

                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) { //check for async function marker
                        warn = true;
                    }

                    if (str.indexOf('async') === 0) {
                        isAsyncAwait = true;
                    }

                    var args = fnArgs(aBeforeOrAfterEach);

                    var indexT, indexDone, indexCtn, indexFatal;
                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfterEach);
                    const hasTParam = (indexT = args.indexOf('t')) > -1;
                    const hasDoneParam = (indexDone = args.indexOf('done')) > -1;
                    const hasCtnParam = (indexCtn = args.indexOf('ctn')) > -1;
                    const hasFatalParam = (indexFatal = args.indexOf('fatal')) > -1;


                    if ((indexT = args.indexOf('t')) > -1) {
                        args.splice(indexT, 1, {
                            log: self.log,
                            data: test.data,
                            desc: String(test.desc),
                            testId: test.testId
                        });
                    }

                    if ((indexT = args.indexOf('_x')) > -1) { //for Babel async/await support
                        args.splice(indexT, 1, {
                            log: self.log,
                            data: test.data,
                            desc: String(test.desc),
                            testId: test.testId
                        });
                    }

                    if (isGeneratorFn) {
                        if (hasDoneParam || hasCtnParam) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfterEach, args, self);
                    }
                    else if (!isAsyncAwait && (hasDoneParam || hasCtnParam || hasFatalParam)) {

                        if (hasDoneParam) {
                            args.splice(indexDone, 1, function done(err) {
                                fini(err);
                            });
                        }

                        if (hasCtnParam) {
                            args.splice(indexCtn, 1, function ctn(val) {
                                fini(null);  //TODO: if we want to log values of tests, we need to pass val onward somewhere
                            });
                        }

                        if (hasFatalParam) {
                            args.splice(indexFatal, 1, function fatal(err) {
                                fini(err || new Error('No error passed by user to fatal fn, but this is fatal now.'));
                            });
                        }

                        //if (!sumanUtils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                        //    throw aBeforeOrAfterEach.NO_DONE;
                        //}

                        aBeforeOrAfterEach.apply(aBeforeOrAfterEach.ctx, args); //TODO: apply(null) is correct?

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfterEach.apply(aBeforeOrAfterEach.ctx, args), warn);

                    }

                });

            });

        }


    }

};