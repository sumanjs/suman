/**
 * Created by denman on 3/13/2016.
 */

//#core
const domain = require('domain');

//#npm
const _ = require('lodash');
const parseFunction = require('parse-function');
const debug_core = require('debug')('suman:core');
const debug_suman_test = require('debug')('suman:test');

//#project
const utils = require('../utils');

module.exports = function (suman, gracefulExit) {

    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {

        debug_suman_test(aBeforeOrAfterEach.type + (aBeforeOrAfterEach.desc ? ':' + aBeforeOrAfterEach.desc : '') + ' - test desc: ' + test.desc);

        //TODO: if an error happens in beforeEach/afterEach we should fail immediately

        var d; //a new domain

        function makeCallback(err) {

            try {
                if (err) {
                    err.sumanFatal = true; //fatal because it's in a before/after each
                }
                clearTimeout(timer);
                d.exit(); //note: domain d is most likely undefined at this point, not sure why
            } catch (err) {
                //process.stderr.write(String(err));
            } finally {
                cb(null, err);
            }
        }

        function handlePotentialPromise(val, warn) {

            if ((!val || (typeof val.then !== 'function')) && warn) { //TODO: check for type == 'Promise' not just null or not
                process.stdout.write('\nSuman warning: you may have forgotten to return a Promise from this test.\n');
            }

            Promise.resolve(val).then(function () {
                done(null);
            }).catch(function (err) {
                done(err);
            });
        }

        var done = _.once(makeCallback);

        var timeout = suman.weAreDebugging ? 500000 : 5000;

        var timer = setTimeout(function () {
            done(aBeforeOrAfterEach.timeOutError);
        }, timeout);

        d = domain.create();
        d._suman = true;

        d.on('error', function (err) {
            this.exit();
            process.nextTick(function () {
                done(err);
            });
        });

        d.run(function () {

            try {

                var warn, isAsync = false;
                var str = aBeforeOrAfterEach.toString();
                if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) { //check for async function marker
                    warn = true;
                }
                if (str.indexOf('async') === 0) {
                    isAsync = true;
                }

                var args = parseFunction(aBeforeOrAfterEach).args;

                var index;
                if ((index = args.indexOf('t')) > -1) {
                    args.splice(index, 1, {
                        log: self.log,
                        data: test.data,
                        desc: String(test.desc),
                        testId: test.testId
                    });
                } else if ((index = args.indexOf('_x')) > -1) { //for Babel async/await support
                    args.splice(index, 1, {
                        log: self.log,
                        data: test.data,
                        desc: String(test.desc),
                        testId: test.testId
                    });
                }

                if (!isAsync && (index = args.indexOf('done')) > -1) {

                    args.splice(index, 1, function (err) {
                        done(err);
                    });
                    if (!utils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                        throw aBeforeOrAfterEach.NO_DONE;
                    }
                    aBeforeOrAfterEach.apply(self, args)
                } else {
                    handlePotentialPromise(aBeforeOrAfterEach.apply(self, args), warn);
                }

            } catch (err) {
                done(err);
            }
        });

    }


}