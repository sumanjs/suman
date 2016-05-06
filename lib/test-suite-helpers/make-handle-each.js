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
            process.nextTick(cb);
        }
        else {
            const timeout = global.weAreDebugging ? 500000 : 5000;

            const timer = setTimeout(function () {
                fini(aBeforeOrAfterEach.timeOutError);
            }, timeout);

            const d = domain.create();
            d._suman = true;

            const fini = helpers.makeCallback(d, null, aBeforeOrAfterEach, timer, 'beforeEach/afterEach', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);

            var dError = false;
            d.on('error', function (err) {
                if (!dError) {
                    dError = true;
                    this.exit();
                    process.nextTick(function () {
                        err = new Error(' => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) =>' + '\n' + err.stack);
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

                    var isAsyncAwait = false;

                    var str = aBeforeOrAfterEach.fn.toString(); //TODO: need to check if it's a promise instead of a function if we go that route

                    var indexT, index_x, indexDone, indexCtn, indexFatal, args = fnArgs(aBeforeOrAfterEach.fn);

                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfterEach.fn);
                    const hasTParam = (indexT = args.indexOf('t')) > -1;
                    const has_xParam = (index_x = args.indexOf('_x')) > -1;
                    const hasDoneParam = (indexDone = args.indexOf('done')) > -1;
                    const hasCtnParam = (indexCtn = args.indexOf('ctn')) > -1;
                    const hasFatalParam = (indexFatal = args.indexOf('fatal')) > -1;


                    if (str.indexOf('async') === 0 || has_xParam) {
                        isAsyncAwait = true;
                    }


                    if (hasTParam) {
                        args.splice(indexT, 1, {
                            log: self.log,
                            data: test.data,
                            desc: String(test.desc),
                            testId: test.testId,
                            value: test.value
                        });
                    }

                    if (has_xParam) { //for Babel async/await support
                        args.splice(indexT, 1, {
                            log: self.log,
                            data: test.data,
                            desc: String(test.desc),
                            testId: test.testId,
                            value: test.value
                        });
                    }

                    if (isGeneratorFn) {
                        if (hasDoneParam || hasCtnParam) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfterEach.fn, args, aBeforeOrAfterEach.ctx);
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

                        aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args); //TODO: apply(null) is correct?

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args), false);

                    }

                });

            });

        }


    }

};