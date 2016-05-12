/**
 * Created by denman on 12/31/2015.
 */


//#npm
const chalk = require('chalk');
const colors = require('colors/safe');

const _ = require('underscore');

//#project
const constants = require('../config/suman-constants');

/////////////////////////////////////////////////////////


module.exports = function (suman, errors, ee) {

    return function makeGracefulExitOrNot(errs, cb) {

        var highestExitCode = 0;
        var exit = false;
        var flip = true;

        errs = _.flatten([errs]);

        errs.filter(function (err) {

            if (err && err.isFromTest && !global.sumanOpts.bail) {
                return undefined;
            }
            else if (err instanceof Error) {
                return err;
            }
            else if (err) {

                if (err.stack) {
                    return err;
                }
                else {
                    console.error('\n\n' + ' => Suman warning => non error passed => ' + err);
                    return new Error(err);
                }

            }
            else {
                return undefined;
            }
        }).map(function (err) {

            if (process.env.NODE_ENV === 'dev_local_debug') {
                console.error(' => Suman graceful exit error: ' + err.stack || err);
            }

            var sumanFatal = err.sumanFatal;
            var exitCode = err.sumanExitCode;

            if (exitCode > highestExitCode) {
                highestExitCode = exitCode;
            }

            var stack = String(err.stack).split('\n');

            return stack.filter(function (item, index) {

                if (sumanFatal && index < 8) {
                    return item;
                }

                if (index === 0) {
                    return item;
                }
                if (item) {
                    if (String(item).match(/at TestSuite/)) {   //TODO: should be TestSuiteBase now?
                        return item;
                    }
                }
            }).join('\n').concat('\n');

        }).forEach(function (err) {

            exit = true;
            ee.removeAllListeners('test_complete'); //stop listening to any test_completion events
            errors.push(err);

            if (typeof process.send === 'function') {
                process.send({
                    type: constants.runner_message_type.FATAL,
                    data: {
                        msg: err,
                        error: err
                    }
                });
            }
            else {
                const isBail = global.sumanOpts.bail ? '(--bail option set to true)' : '';
                const str = '\n\n' + ' \u2691 ' +
                    colors.bgRed.white(' => Suman fatal error ' + isBail +
                        ' => making a graceful exit => ') + '\n' + colors.red(err);

                console.log(str.split('\n').map(function (s) {
                    return '\t' + s;
                }).join('\n'));
            }

        });

        if (exit) {
            if (!global.sumanCompleted) {
                // note: we need this check because on occasion errors occur in async code that don't get thrown
                // until after all boxes are checked in the system, we ignore the exit code in that case 
                suman.logFinished(highestExitCode || 1);
                process.exit(highestExitCode || 1);
            }
        }
        else {
            cb();
        }
    }
};