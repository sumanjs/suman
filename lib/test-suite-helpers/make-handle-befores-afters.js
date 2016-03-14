/**
 * Created by denman on 3/14/2016.
 */


//#core
const domain = require('domain');

//#npm
const _ = require('lodash');

//#project
const utils = require('../utils');
const parseFunction = require('parse-function');
const debug_core = require('debug')('suman:core');
const debug_suman_test = require('debug')('suman:test');
const helpers = require('./handle-callback-helpers');

module.exports = function (suman) {

    //TODO: befores afters and before eaches before afters need to handle promises too

    return function (self) {

        return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

            debug_suman_test(aBeforeOrAfter.type + (aBeforeOrAfter.desc ? ':' + aBeforeOrAfter.desc : ''));
            const timeout = suman.weAreDebugging ? 500000 : 5000;
            const timer = setTimeout(function () {
                done(aBeforeOrAfter.timeOutError);
            }, timeout);

            const d = domain.create();
            d._suman_before_after = true;

            const done = helpers.makeCallback(d, timer, true, cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(done);

            d.on('error', function (err) {
                this.exit();
                process.nextTick(function () {
                    done(err);
                });
            });

            d.run(function () {

                var warn = false;
                const str = aBeforeOrAfter.toString();
                if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                    warn = true;
                }

                try {
                    const args = parseFunction(aBeforeOrAfter).args;
                    var index;

                    if ((index = args.indexOf('done')) > -1) {
                        args.splice(index, 1, function (err) {
                            done(err);
                        });
                        if (!utils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                            throw aBeforeOrAfter.NO_DONE;
                        }
                        aBeforeOrAfter.apply(self, args)
                    } else {
                        handlePotentialPromise(aBeforeOrAfter.apply(self, args), warn);
                    }
                } catch (err) {
                    done(err);
                }
            });
        }
    }
}