/**
 * Created by denman on 3/13/2016.
 */

//#core
const domain = require('domain');

//#npm
const _ = require('lodash');
const parseFunction = require('parse-function');
const debugCore = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');
const helpers = require('./handle-callback-helpers');

//#project
const utils = require('../utils');

module.exports = function (suman, gracefulExit) {

    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {

        debugSumanTest(aBeforeOrAfterEach.type + (aBeforeOrAfterEach.desc ? ':' + aBeforeOrAfterEach.desc : '') + ' - test desc: ' + test.desc);

        const timeout = suman.weAreDebugging ? 500000 : 5000;
        const timer = setTimeout(function () {
            done(aBeforeOrAfterEach.timeOutError);
        }, timeout);

        const d = domain.create();
        d._suman = true;

        const done = helpers.makeCallback(d, timer, true, cb);
        const handlePotentialPromise = helpers.handlePotentialPromise(done);

        d.on('error', function (err) {
            this.exit();
            process.nextTick(function () {
                if (err.sumanFatal) {
                    gracefulExit([err]);
                } else {
                    done(err);
                }
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

};