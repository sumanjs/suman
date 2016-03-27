/**
 * Created by denman on 3/13/2016.
 */


//#core
const domain = require('domain');

//#npm
const fnArgs = require('function-arguments');
const _ = require('lodash');

//#project
const sumanUtils = require('../utils');
const helpers = require('./handle-callback-helpers');

module.exports = function init(suman, gracefulExit) {

    return function handleTest(self, test, cb) {

        const timeout = suman.weAreDebugging ? 500000 : test.timeout;
        const timer = setTimeout(function () {
            test.timedOut = true;
            fini(test.cb.timeOutError);
        }, timeout);

        const d = domain.create();
        d._sumanTest = true;

        const fini = helpers.makeCallback(d, timer, false, cb);
        //const t = helpers.makeTestInjection(test, self, fini);
        const handlePotentialPromise = helpers.handlePotentialPromise(fini);
        const handleGenerator = helpers.makeHandleGenerator(fini);

        d.on('error', function (err) {

            console.error('Test error in domain:', err.stack);
            this.exit(); //extra handle for exiting domain
            //TODO: we need to call done asap instead of in process.nextTick otherwise it can be called by another location
            fini(err);
            //process.nextTick(function () {
            //    done(err);
            //});

        });

        d.run(function () {

            var warn = false;

            var str = test.cb.toString();

            if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {  //TODO: this check needs to get updated, async functions should return promises implicitly
                warn = true;
            }

            debugger;
            var indexT, indexDone, indexPass, indexFail, indexP, indexFatal;
            const args = fnArgs(test.cb);
            const isGeneratorFn = sumanUtils.isGeneratorFn(test.cb);
            const hasTParam = (indexT = args.indexOf('t')) > -1;
            const hasDoneParam = (indexDone = args.indexOf('done')) > -1;
            const hasPassParam = (indexPass = args.indexOf('pass')) > -1;
            const hasFailParam = (indexFail = args.indexOf('fail')) > -1;
            const hasFatalParam = (indexFatal = args.indexOf('fatal')) > -1;
            //const hasPParam = (indexP = args.indexOf('p')) > -1;


            if (hasTParam) {
                args.splice(indexT, 1, {
                    log: self.log,
                    data: test.data,
                    desc: String(test.desc),
                    testId: test.testId
                });
            }


            if (isGeneratorFn) {
                if (hasDoneParam) {
                    throw new Error('Generator function callback also asking for done param => inconsistent.');
                }

                handleGenerator(test.cb, args, self);

            }
            else if (hasDoneParam || hasPassParam || hasFailParam || hasFatalParam) {

                if (hasDoneParam) {
                    args.splice(indexDone, 1, function done(err) {
                        fini(err);
                    });
                }

                if (hasPassParam) {
                    args.splice(indexPass, 1, function pass(val) {
                        fini(null, val);   //TODO: use spread operator here
                    });
                }

                if (hasFailParam) {
                    args.splice(indexFail, 1, function fail(err) {
                        fini(err || new Error('fail() was called on test, but null/undefined value was passed as first arg to the fail function.'));
                    });
                }

                if (hasFatalParam) {
                    args.splice(indexFatal, 1, function fatal(err) {
                        err = err || new Error('Temp error since user did not provide one.');
                        err.sumanFatal = true;
                        fini(err);
                    });
                }

                //if(hasPParam){
                //    const executor = function(){
                //
                //    };
                //
                //    args.splice(indexP, 1, new Promise());
                //}


                //if (!sumanUtils.checkForValInStr(test.cb.toString(), /done/g)) {
                //    throw test.cb.NO_DONE;
                //}

                test.cb.apply(self, args)
            }
            else {
                handlePotentialPromise(test.cb.apply(self, args), warn);
            }

        });

    }
};