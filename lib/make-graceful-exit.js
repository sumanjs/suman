/**
 * Created by denman on 12/31/2015.
 */


var colors = require('colors/safe');

module.exports = function (errors) {

    return function makeGracefulExitOrNot(errs, cb) {

        var exit = false;

        errs.filter(function (err) {
            if (err instanceof Error) {
                return err;
            }
            else if(err){
                console.error('\n\n' + colors.bgRed('non error passed - ') + err);
                return new Error(err);
            }
        }).map(function (err) {

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

        }).forEach(function (err) {
            exit = true;
            errors.push(err);
            if (process.send) {
                process.send({msg: err, type: 'FATAL', fatal: true});
            }
            else {
                console.error(err);
            }

        });

        if(exit){
            process.exit();
        }
        else{
            cb();
        }

    }
};