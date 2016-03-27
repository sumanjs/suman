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

module.exports = function (suman, gracefulExit) {

    return function (self) {

        return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

            debugSumanTest(aBeforeOrAfter.type + (aBeforeOrAfter.desc ? ':' + aBeforeOrAfter.desc : ''));
            const timeout = suman.weAreDebugging ? 500000 : 5000;
            const timer = setTimeout(function () {
                fini(aBeforeOrAfter.timeOutError);
            }, timeout);

            const d = domain.create();
            d._sumanBeforeAfter = true;

            const fini = helpers.makeCallback(d, timer, true, cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);

            d.on('error', function (err) {
                this.exit();
                process.nextTick(function () {
                    if (err.sumanFatal) {
                        gracefulExit([err]);
                    } else {
                        fini(err);
                    }
                });
            });

            d.run(function () {

                var warn = false;
                const str = aBeforeOrAfter.toString();
                if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                    warn = true;
                }


                const args = fnArgs(aBeforeOrAfter);

                var indexDone, indexCtn, indexFatal;
                const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfter);

                const hasDoneParam = (indexDone = args.indexOf('done')) > -1;
                const hasCtnParam = (indexCtn = args.indexOf('ctn')) > -1;
                const hasFatalParam = (indexFatal = args.indexOf('fatal')) > -1;


                if (isGeneratorFn) {

                    if (hasDoneParam || hasCtnParam) {
                        throw new Error('Generator function callback also asking for done param => inconsistent.');
                    }

                    handleGenerator(aBeforeOrAfter, args, self);
                }

                else if (hasDoneParam || hasCtnParam) {

                    //TODO: if function is passed only fatal function then what?

                    if (hasDoneParam) {
                        args.splice(indexDone, 1, function done(err) {
                            fini(err);
                        });
                    }

                    if (hasCtnParam) {
                        args.splice(indexCtn, 1, function ctn(err) {
                            fini(err);
                        });
                    }

                    if (hasFatalParam) {
                        args.splice(indexFatal, 1, function fatal(err) {
                            fini(err);
                        });
                    }


                    //if (!sumanUtils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                    //    throw aBeforeOrAfter.NO_DONE;
                    //}

                    aBeforeOrAfter.apply(self, args);

                }
                else {

                    handlePotentialPromise(aBeforeOrAfter.apply(self, args), warn);

                }

            });
        }
    }
};