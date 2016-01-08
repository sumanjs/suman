/**
 * Created by denman on 12/31/2015.
 */


var colors = require('colors/safe');

module.exports = function(errors){

    return function makeGracefulExitOrNot(errs, cb) {

        errs = errs.filter(function (err) {
            if (err instanceof Error) {
                console.error(err.stack);
                return err;
            }
            else if (!err) {
                return undefined;
            }
            else {
                console.error('\n\n' + colors.bgRed('non error passed - ') + err);
                return new Error(err);
            }
        }).map(function (err) {
            //return err.message;
            return err.stack;
        });

        if (errs && errs.length > 0) {
            //console.log('omg!!! errors:', errs);
            errs.forEach(function (err) {
                errors.push(err);
            });
            process.exit();
        }
        else {
            cb();
        }

    }
};