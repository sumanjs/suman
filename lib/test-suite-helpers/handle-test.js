/**
 * Created by denman on 3/13/2016.
 */


//#core
const domain = require('domain');

//#npm
const parseFunction = require('parse-function');
const _ = require('lodash');

//#project
const utils = require('../utils');


module.exports = function init(suman, gracefulExit) {

    return function handleTest(self, test, cb) {

        var d;

        function makeCallback(err) {
            try {
                clearTimeout(timer);
                d.exit(); //domain is most likely undefined at this point, not sure why
            } catch (err) {
                //process.stderr.write(err);
            } finally {
                cb(null, err);
            }

        }

        function handlePotentialPromise(val, warn) {

            if ((!val || (typeof val.then !== 'function')) && warn) {
                process.stdout.write('\nSuman warning: you may have forgotten to return a Promise from this test.\n');
            }

            Promise.resolve(val).then(function () {
                done(null);
            }).catch(function (err) {
                done(err);
            });
        }

        var done = _.once(makeCallback);

        var timeout = suman.weAreDebugging ? 500000 : test.timeout;

        var timer = setTimeout(function () {

            test.timedOut = true;
            done(test.cb.timeOutError);
        }, timeout);

        d = domain.create();
        d._suman_test = true;

        d.on('error', function (err) {

            console.error('???:', err.stack);
            this.exit(); //extra handle for exiting domain
            process.nextTick(function () {
                if (err.sumanFatal) {
                    gracefulExit([err]);
                } else {
                    done(err);
                }
            });

        });

        d.run(function () {

            var warn = false;
            var str = test.cb.toString();
            if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                warn = true;
            }

            var args = parseFunction(test.cb).args;

            var index;
            if ((index = args.indexOf('t')) > -1) {
                args.splice(index, 1, {
                    log: self.log,
                    data: test.data,
                    desc: String(test.desc),
                    testId: test.testId
                });
            }

            if ((index = args.indexOf('done')) > -1) {
                args.splice(index, 1, function (err) {
                    done(err);
                });
                if (!utils.checkForValInStr(test.cb.toString(), /done/g)) {
                    throw test.cb.NO_DONE;
                }
                test.cb.apply(self, args)
            } else {
                handlePotentialPromise(test.cb.apply(self, args), warn);
            }

        });

    }
};