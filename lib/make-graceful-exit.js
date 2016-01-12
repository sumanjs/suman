/**
 * Created by denman on 12/31/2015.
 */


var colors = require('colors/safe');

module.exports = function (errors) {

    return function makeGracefulExitOrNot(errs, cb) {

        errs = errs.filter(function (err) {
            if (err instanceof Error) {
                //console.error(err.stack);
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
            //return err.stack;

            var stack = String(err.stack).split('\n');
            return [stack[0], stack[1], stack[2], stack[3]].filter(function (item, index) {
                if (index === 0) {
                    return item;
                }
                if (item) {
                    if (String(item).match(/at TestSuite/)) {
                        return item;
                    }
                }
            }).join('\n');
        });

        if (errs && errs.length > 0) {
            errs.forEach(function (err) {
                errors.push(err);
                if(process.send){
                    process.send({msg: err.stack, type: 'FATAL', fatal: true});
                }
                else{
                    console.error(err.stack);
                }
            });
            process.exit();
        }
        else {
            cb();
        }

    }
};