/**
 * Created by amills001c on 12/28/15.
 */


var makeTemp = require('./make-temp');


function handleExit(suman, testErrors, errors){

    process.on('exit', function () {

        if (testErrors.length > 0 || errors.length > 0) {
            if (suman.usingRunner) {
                process.send({exitCode: 1, errors: errors, testErrors: testErrors, type: 'exit'});
                process.exit(1);
            }
            else {
                console.error('errors present, exiting with code 1, errors: ' + JSON.stringify(errors) + ', testErrors: ' + JSON.stringify(testErrors));

                makeTemp.makeComplete({
                    timestamp: suman.timestamp,
                    config: suman.config
                }, function (err) {
                    process.exit(1);
                });

            }

        }
        else {
            if (suman.usingRunner) {
                process.send({exitCode: 0, errors: errors, testErrors: testErrors, type: 'exit'});
                process.exit(0);
            }
            else {
                console.error('ind X test - no errors present, exiting with code 0');
                makeTemp.makeComplete({
                    timestamp: suman.timestamp,
                    config: suman.config
                }, function (err) {
                    process.exit(0);
                });
            }
        }
    });


}


module.exports = handleExit;