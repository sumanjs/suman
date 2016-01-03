/**
 * Created by amills001c on 12/28/15.
 */


var makeTemp = require('./finalize-output');


function handleExit(suman, testErrors, errors) {

    process.on('exit', function () {

        //process.stdin.resume();
        var exitCode = null;
        var message = null;

        if (testErrors.length > 0 || errors.length > 0) {
            exitCode = 1;
            message = 'errors present, exiting with code 1, errors: ' + JSON.stringify(errors) + ', testErrors: ' + JSON.stringify(testErrors);
        }
        else {
            exitCode = 0
            message = 'no errors present, exiting with code 0';
        }

        if (suman.usingRunner) {
            process.send({exitCode: 0, errors: errors, testErrors: testErrors, type: 'exit'});
            process.exit(exitCode);
        }
        else {
            //TODO why does this log before tests results?
            //console.error(message);
            makeTemp.makeComplete({
                timestamp: suman.timestamp,
                config: suman.config
            }, function (errs) {
                if(errs.length > 0){
                    console.log('errs:', errs);
                }
                process.exit(exitCode);
            });
        }

    });


}


module.exports = handleExit;