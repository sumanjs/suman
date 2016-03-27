/**
 * Created by denman on 12/31/2015.
 */


//#npm
const chalk = require('chalk');
const colors = require('colors/safe');

/////////////////////////////////////////////////////////


module.exports = function (suman, errors, ee) {


    return function makeGracefulExitOrNot(errs, cb) {

        var exit = false;

        errs.filter(function (err) {
            if (err instanceof Error) {
                return err;
            }
            else if (err) {
                console.error('\n\n' + chalk.bgRed('non error passed - ') + err);
                return new Error(err);
            }
            else {
                //do nothing / return undefined
            }
        }).map(function (err) {

            if(process.env.NODE_ENV === 'dev_local_debug'){
                console.error(' => Suman graceful exit error: ' + err.stack || err);
            }

            var sumanFatal = err.sumanFatal;

            var stack = String(err.stack).split('\n');
            return stack.filter(function (item, index) {

                if (sumanFatal && index < 8) {
                    return item;
                }

                if (index === 0) {
                    return item;
                }
                if (item) {
                    if (String(item).match(/at TestSuite/)) {
                        return item;
                    }
                }
            }).join('\n').concat('\n');

        }).forEach(function (err) {
            exit = true;
            ee.removeAllListeners('test_complete'); //stop listening to any test_completion events
            errors.push(err);
            if (process.send) {
                process.send({msg: err, stack: err, type: 'FATAL', fatal: true});
            }
            //else {
            //    console.error(err);  //err.stack is not defined here, just use err
            //}

        });

        if (exit) {
            process.exit();
        }
        else {
            cb();
        }

    }
};